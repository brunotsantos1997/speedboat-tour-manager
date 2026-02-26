// src/ui/screens/VoucherTermsScreen.tsx
import React from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useVoucherTermsViewModel } from '../../viewmodels/useVoucherTermsViewModel';
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading2, Palette, Highlighter } from 'lucide-react';
import { useToastContext } from '../../ui/contexts/ToastContext';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';

const MenuBar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const buttonClass = "p-2 rounded hover:bg-gray-200 flex items-center justify-center";
  const activeClass = "bg-blue-500 text-white hover:bg-blue-600";

  return (
    <div className="flex flex-wrap items-center p-2 border-b border-gray-300 bg-gray-50 rounded-t-lg gap-1">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`${buttonClass} ${editor.isActive('bold') ? activeClass : ''}`} title="Negrito"><Bold size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`${buttonClass} ${editor.isActive('italic') ? activeClass : ''}`} title="Itálico"><Italic size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`${buttonClass} ${editor.isActive('strike') ? activeClass : ''}`} title="Riscado"><Strikethrough size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${buttonClass} ${editor.isActive('heading', { level: 2 }) ? activeClass : ''}`} title="Título"><Heading2 size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${buttonClass} ${editor.isActive('bulletList') ? activeClass : ''}`} title="Lista"><List size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${buttonClass} ${editor.isActive('orderedList') ? activeClass : ''}`} title="Lista Numerada"><ListOrdered size={18} /></button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <div className="relative flex items-center">
        <button className={buttonClass} title="Cor do Texto">
          <label className="cursor-pointer flex items-center">
            <Palette size={18} />
            <input
              type="color"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
              value={editor.getAttributes('textStyle').color || '#000000'}
            />
          </label>
        </button>
      </div>

      <div className="relative flex items-center">
        <button className={`${buttonClass} ${editor.isActive('highlight') ? activeClass : ''}`} title="Card de Ênfase (Fundo)">
          <label className="cursor-pointer flex items-center">
            <Highlighter size={18} />
            <input
              type="color"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onInput={(e) => editor.chain().focus().setHighlight({ color: (e.target as HTMLInputElement).value }).run()}
              value={editor.getAttributes('highlight').color || '#ffff00'}
            />
          </label>
        </button>
        {editor.isActive('highlight') && (
           <button
             onClick={() => editor.chain().focus().unsetHighlight().run()}
             className="ml-1 text-[10px] bg-red-100 text-red-600 px-1 rounded hover:bg-red-200"
           >
             Remover
           </button>
        )}
      </div>
    </div>
  );
};

export const VoucherTermsScreen: React.FC = () => {
  const { terms, isLoading, saveTerms } = useVoucherTermsViewModel();
  const { showToast } = useToastContext();

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: terms,
    onUpdate: () => {
      // The content is saved on button click
    },
  });

  React.useEffect(() => {
    if (!isLoading && editor) {
      editor.commands.setContent(terms);
    }
  }, [terms, isLoading, editor]);

  const handleSave = () => {
    if (editor) {
      saveTerms(editor.getHTML());
      showToast('Termos salvos com sucesso!');
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900">Termos do Voucher</h1>
                <p className="text-gray-500">Regras e políticas exibidas no rodapé do voucher</p>
            </div>
            <button onClick={handleSave} className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
                Salvar Termos
            </button>
        </div>
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
            <MenuBar editor={editor} />
            <div className="prose prose-sm max-w-none">
                <style>{`
                  .ProseMirror mark {
                    padding: 0.15rem 0.35rem;
                    border-radius: 0.5rem;
                    box-decoration-break: clone;
                    -webkit-box-decoration-break: clone;
                  }
                `}</style>
                <EditorContent editor={editor} className="p-6 min-h-[400px] outline-none" />
            </div>
        </div>
      </div>
    </div>
  );
};
