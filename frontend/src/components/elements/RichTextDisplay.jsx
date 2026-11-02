import DOMPurify from 'dompurify';
import 'react-quill-new/dist/quill.snow.css';

export default function RichTextDisplay({ content }) {
    const sanitizedContent = DOMPurify.sanitize(content);
    return (
        <div
            className="ql-editor"
            style={{ padding: 0, overflow: 'hidden' }}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
    );
}
