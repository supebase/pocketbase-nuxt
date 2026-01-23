import type { Editor } from '@tiptap/vue-3';
import { getSafeTextAfter } from './editor-utils';

// Link 逻辑
export function useEditorLink(editor: Ref<Editor | null>, autoOpen = false) {
  const url = ref('');
  const open = ref(false);
  const suffix = '{target=_blank}';

  const active = computed(() => editor.value?.isActive('link') ?? false);

  const updateUrl = () => {
    if (!editor.value) return;
    const { href } = editor.value.getAttributes('link');
    url.value = href || '';
  };

  watch(
    editor,
    (newEditor, _, onCleanup) => {
      if (!newEditor) return;
      updateUrl();
      newEditor.on('selectionUpdate', updateUrl);
      onCleanup(() => newEditor.off('selectionUpdate', updateUrl));
    },
    { immediate: true },
  );

  watch(active, (isActive) => {
    if (isActive && autoOpen) open.value = true;
  });

  const setLink = () => {
    if (!editor.value) return;
    if (!url.value) return removeLink();

    const ed = editor.value;
    ed.chain().focus().extendMarkRange('link').setLink({ href: url.value }).run();
    ed.chain().focus().extendMarkRange('link').run();

    const latestEndPos = ed.state.selection.to;
    const textAfter = getSafeTextAfter(ed, latestEndPos, suffix.length);

    if (textAfter !== suffix) {
      ed.chain().focus().insertContentAt(latestEndPos, suffix).run();
      ed.commands.setTextSelection(latestEndPos + suffix.length);
    }
    open.value = false;
  };

  const removeLink = () => {
    if (!editor.value) return;
    const ed = editor.value;
    ed.chain().focus().extendMarkRange('link').run();
    const linkEndPos = ed.state.selection.to;
    ed.chain().focus().unsetLink().run();

    if (getSafeTextAfter(ed, linkEndPos, suffix.length) === suffix) {
      ed.chain()
        .focus()
        .deleteRange({ from: linkEndPos, to: linkEndPos + suffix.length })
        .run();
    }
    url.value = '';
    open.value = false;
  };

  return { url, open, active, setLink, removeLink };
}

// Image 逻辑
export function useEditorImage(editor: Ref<Editor | null>) {
  const url = ref('');
  const open = ref(false);

  const updateImageUrl = () => {
    if (!editor.value) return;
    const { src } = editor.value.getAttributes('image');
    url.value = src || '';
  };

  watch(
    editor,
    (newEditor, _, onCleanup) => {
      if (!newEditor) return;
      updateImageUrl();
      newEditor.on('selectionUpdate', updateImageUrl);
      onCleanup(() => newEditor.off('selectionUpdate', updateImageUrl));
    },
    { immediate: true },
  );

  const setImage = () => {
    if (!url.value || !editor.value) return;
    editor.value.chain().focus().setImage({ src: url.value }).run();
    open.value = false;
  };

  return { url, open, setImage };
}
