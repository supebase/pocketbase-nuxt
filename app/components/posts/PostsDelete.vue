<template>
    <UDropdownMenu arrow size="lg" :ui="{ item: 'cursor-pointer' }" :items="menuItems">
        <Icon name="i-hugeicons:more-horizontal"
            class="size-5 text-dimmed cursor-pointer hover:text-primary transition-colors" />
    </UDropdownMenu>

    <ModalDelete v-model:open="isModalOpen" :loading="isDeleting" @confirm="confirmDelete">
        <div class="flex flex-col gap-2">
            <div class="text-sm text-primary font-semibold tracking-wider">即将消失的数据</div>
            <div class="text-sm text-muted line-clamp-2">
                {{ item.cleanContent }}
            </div>
        </div>
    </ModalDelete>
</template>

<script setup lang="ts">
interface Props {
    item: {
        id: string;
        cleanContent?: string;
    };
    canViewDrafts: boolean;
}

const props = defineProps<Props>();
const toast = useToast();

const isModalOpen = ref(false);
const isDeleting = ref(false);

const menuItems = computed(() => [
    {
        icon: 'i-hugeicons:edit-04',
        label: '编辑',
        onClick: () => props.canViewDrafts ? navigateTo(`/edit/${props.item.id}`) : showAuthToast(),
    },
    {
        icon: 'i-hugeicons:delete-01',
        label: '删除',
        color: 'error' as const,
        onClick: () => props.canViewDrafts ? (isModalOpen.value = true) : showAuthToast(),
    },
]);

const confirmDelete = async () => {
    isDeleting.value = true;
    try {
        await $fetch(`/api/collections/post/${props.item.id}`, {
            method: 'DELETE',
        });

        isModalOpen.value = false;

        toast.add({
            title: "删除成功",
            icon: "i-hugeicons:checkmark-circle-03",
            color: "success",
        });
    } catch (err: any) {
        toast.add({
            title: "删除失败",
            description: err.data?.message || '请稍后重试',
            icon: "i-hugeicons:alert-02",
            color: "error",
        });
    } finally {
        isDeleting.value = false;
    }
};

const showAuthToast = () => {
    toast.add({
        title: '权限不足',
        description: '只有已认证用户可以进行此操作',
        icon: "i-hugeicons:alert-02",
        color: "warning",
    });
};
</script>