<template>
    <UDropdownMenu arrow size="lg" :ui="{ item: 'cursor-pointer' }" :items="[
        {
            icon: 'i-hugeicons:edit-04',
            label: '编辑',
            color: 'neutral',
            onClick: () => props.canViewDrafts ? navigateTo(`/edit/${props.item.id}`) : showAuthToast(),
        },
        {
            icon: 'i-hugeicons:delete-01',
            label: '删除',
            color: 'error',
            onClick: () => props.canViewDrafts ? openDeleteModal(props.item.id) : showAuthToast(),
        },
    ]">
        <Icon name="i-hugeicons:more-horizontal" class="size-5 text-dimmed cursor-pointer" />
    </UDropdownMenu>
    <ModalDelete v-model:open="isModalOpen" :loading="isDeleting" @confirm="confirmDelete">
        <div class="flex flex-col gap-2">
            <div class="text-sm text-primary font-semibold">即将消失的数据</div>
            <div class="text-sm text-muted line-clamp-2">{{ props.item.cleanContent }}</div>
        </div>
    </ModalDelete>
</template>

<script setup lang="ts">
interface Props {
    item: {
        id: string;
        cleanContent: string;
    };
    canViewDrafts: boolean;
}

const props = defineProps<Props>();

const toast = useToast();
const isModalOpen = ref(false);
const isDeleting = ref(false);
const selectedId = ref<string | null>(null);

const openDeleteModal = (id: string) => {
    selectedId.value = id
    isModalOpen.value = true
}

const confirmDelete = async () => {
    if (!selectedId.value) return

    isDeleting.value = true;
    try {
        await $fetch(`/api/collections/post/${selectedId.value}`, {
            method: 'DELETE',
        });

        await refreshNuxtData('posts-list-data');
    } catch (err: any) {
        toast.add({
            title: "删除失败",
            description: err.data?.message || '删除失败，请稍后重试',
            icon: "i-hugeicons:alert-02",
            color: "error",
        });
    } finally {
        isDeleting.value = false;
        selectedId.value = null;
    }
}

const showAuthToast = () => {
    toast.add({
        title: '权限不足',
        description: '您需要登录并认证才能对内容进行操作',
        icon: "i-hugeicons:alert-02",
        color: "error",
    })
}
</script>