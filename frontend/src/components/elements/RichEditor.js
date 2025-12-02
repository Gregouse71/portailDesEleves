import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';

// Add sizes to whitelist and register them with Quill
const size = Quill.import('attributors/style/size');
const fontSizes = ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '22px', '24px', '26px', '28px', '36px', '48px', '72px'];
const toolbarFontSizes = ['13px', ...fontSizes];
size.whitelist = toolbarFontSizes;
Quill.register(size, true);

/** DANGER : Ce composant renvoie HTML qui doit être purifié avant l'affichage ! */
const RichEditor = ({ value, onChange }) => {
    const modules = {
        toolbar: [
            [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
            [{'size': toolbarFontSizes}],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'color': [] }, { 'background' : [] }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            ['link'],
            ['clean']
        ],
    };

    return (
        <ReactQuill
            theme="snow"
            value={value}
            onChange={onChange}
            modules={modules}
        />
    );
}

export const RichTextDisplay = ({ content }) => {
  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <div
    className='ql-editor'
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default RichEditor;