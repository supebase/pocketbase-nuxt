<template>
  <div>
    <div class="flex items-center gap-3 select-none">
      <UButton
        to="/auth"
        color="neutral"
        variant="link"
        icon="i-hugeicons:lock-key"
        tabindex="-1"
        class="rounded-full"
        v-if="!loggedIn"
      />

      <div class="flex items-center gap-3" v-else>
        <UUser size="sm">
          <template #avatar>
            <div class="size-7 rounded-full overflow-hidden">
              <CommonGravatar :avatar-id="user?.avatar" :size="56" />
            </div>
          </template>
        </UUser>

        <USeparator orientation="vertical" class="h-6" />

        <UButton
          to="/new"
          color="neutral"
          variant="link"
          icon="i-hugeicons:add-circle-half-dot"
          tabindex="-1"
          class="rounded-full"
          v-if="user?.verified"
        />

        <AuthLogoutButton />
      </div>
      <ModalSearch />
      <CommonColorModeButton />
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, loggedIn } = useUserSession();
</script>
