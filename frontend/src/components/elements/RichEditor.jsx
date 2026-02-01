import React, { useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import '../../assets/styles/rich_editor.scss';
import DOMPurify from 'dompurify';

// 1. Setup Style Attributor & Whitelist
// We must register this BEFORE the component renders
const Size = Quill.import('attributors/style/size');
const fontSizes = [
  '8px', '9px', '10px', '11px', '12px', '13px', '14px', 
  '16px', '18px', '20px', '22px', '24px', '26px', '28px', 
  '36px', '48px', '72px'
];
Size.whitelist = fontSizes;
Quill.register(Size, true);

/** * Helper: Finds the closest supported size in your whitelist.
 * Converts 'pt' to 'px' if necessary.
 */
const getClosestFontSize = (inputValue) => {
    if (!inputValue) return null;

    let pixelValue = parseFloat(inputValue);
    
    // Handle 'pt' (Points) from Word/Google Docs (1pt = ~1.33px)
    if (inputValue.includes('pt')) {
        pixelValue = pixelValue * 1.3333;
    }
    // Handle 'rem' (assuming 16px root)
    else if (inputValue.includes('rem')) {
        pixelValue = pixelValue * 16;
    }

    // Find the closest value in our whitelist
    const closest = fontSizes.reduce((prev, curr) => {
        const currNum = parseFloat(curr);
        const prevNum = parseFloat(prev);
        return (Math.abs(currNum - pixelValue) < Math.abs(prevNum - pixelValue) ? curr : prev);
    });

    return closest;
};

const RichEditor = ({ value, onChange }) => {

    // 2. Define modules with useMemo to prevent re-renders
    const modules = useMemo(() => ({
        toolbar: [
            [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
            [{ 'size': fontSizes }], 
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            ['link'],
            ['clean']
        ],
        clipboard: {
            matchVisual: false,
            matchers: [
                // 3. The Matcher: Intercepts every HTML element being pasted
                [Node.ELEMENT_NODE, (node, delta) => {
                    // READ FROM DOM: Check if the original HTML element has a font-size
                    const rawFontSize = node.style.fontSize;
                    
                    if (!rawFontSize) {
                        return delta; // No size? Return standard processing
                    }

                    // Calculate closest size from whitelist
                    const fixedSize = getClosestFontSize(rawFontSize);

                    // WRITE TO DELTA: Force this size onto the pasted content
                    const newOps = delta.ops.map(op => {
                        // Apply size only to text inserts
                        if (op.insert && typeof op.insert === 'string') {
                            return {
                                ...op,
                                attributes: { ...op.attributes, size: fixedSize }
                            };
                        }
                        return op;
                    });

                    delta.ops = newOps;
                    return delta;
                }]
            ]
        }
    }), []);

    return (
        <ReactQuill
            theme="snow"
            value={value}
            onChange={onChange}
            modules={modules}
        />
    );
};

export const RichTextDisplay = ({ content }) => {
    const sanitizedContent = DOMPurify.sanitize(content);
    return (
        <div
            className='ql-editor'
            style={{ padding: 0, overflow: 'hidden' }}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
    );
};

export default RichEditor;