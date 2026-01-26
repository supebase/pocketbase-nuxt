<template>
  <aside class="hidden xl:block absolute top-1 left-full ml-9.5 w-72 h-full select-none">
    <div class="sticky top-28 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
      <nav v-if="toc?.links?.length">
        <ul class="space-y-1 border-l border-neutral-200 dark:border-neutral-800 pl-4">
          <template v-for="link in toc.links" :key="link.id">
            <TOCItem :link="link" :active-id="activeId" @scroll="scrollToAnchor" />
          </template>
        </ul>
      </nav>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { TocLink } from '~/types';

defineProps<{
  toc?: {
    links: TocLink[];
  };
}>();

// 内部小组件：处理递归渲染和层次感
const TOCItem = defineComponent({
  name: 'TOCItem',
  props: ['link', 'activeId'],
  emits: ['scroll'],

  setup(props, { emit }) {
    return () =>
      h('li', { class: 'list-none' }, [
        h(
          'a',
          {
            href: `#${props.link.id}`,
            onClick: (e: Event) => {
              e.preventDefault();
              emit('scroll', props.link.id);
            },
            class: [
              'block text-[13px] font-medium leading-relaxed transition-all duration-300 px-2 rounded-md truncate',
              // 根据深度动态增加缩进（右对齐时使用 pr）
              props.link.depth === 3 ? 'pl-6 py-0.75' : '',
              props.link.depth === 4 ? 'pl-13 py-0.75' : '',
              props.activeId === props.link.id
                ? 'text-primary font-medium translate-x-[8px]'
                : 'text-dimmed hover:text-primary',
            ],
          },
          props.link.text,
        ),
        // 如果有子标题，递归渲染
        props.link.children?.length
          ? h(
              'ul',
              { class: 'mt-1' },
              props.link.children.map((child: TocLink) =>
                h(TOCItem, {
                  link: child,
                  activeId: props.activeId,
                  onScroll: (id: string) => emit('scroll', id),
                }),
              ),
            )
          : null,
      ]);
  },
});

const activeId = ref('');

const scrollToAnchor = (id: string) => {
  const el = document.getElementById(id);

  if (el) {
    const offset = 100;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    activeId.value = id;
  }
};

// 监听滚动以更新 activeId
const updateActiveId = () => {
  // 1. 获取所有标题并转换为数组以获得更好的类型支持
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')) as HTMLElement[];

  let currentId = '';

  // 2. 逆向查找当前激活的标题
  for (let i = headings.length - 1; i >= 0; i--) {
    const heading = headings[i];

    // 增加 null 检查和 ID 存在检查
    if (heading) {
      const top = heading.getBoundingClientRect().top;

      // 阈值：标题到达视口顶部下方 150px 时激活
      if (top < 150) {
        currentId = heading.id;
        break; // 找到第一个符合条件的就退出循环
      }
    }
  }

  // 只有在 ID 变化时才更新，减少重新渲染
  if (currentId && activeId.value !== currentId) {
    activeId.value = currentId;
  }
};

onMounted(() => {
  // 3. 使用 passive: true 提升滚动性能
  window.addEventListener('scroll', updateActiveId, { passive: true });
  // 初始化执行一次
  nextTick(updateActiveId);
});

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveId);
});
</script>
