<template>
  <div class="flex items-center gap-3 select-none">
    <ModalSearch />
    <StatsUsers />
    <CommonColorModeButton />

    <USeparator orientation="vertical" class="h-6" />

    <div class="auth-wrapper">
      <Transition name="auth-slide" mode="out-in">
        <div v-if="!loggedIn" key="login" class="auth-item">
          <UButton to="/auth" color="neutral" variant="link" icon="i-hugeicons:lock-key" class="rounded-full" />
        </div>

        <div v-else key="user" class="auth-item flex items-center gap-3">
          <AuthLogoutButton :loading="isLoggingOut" />

          <div class="avatar-pop">
            <UUser size="sm">
              <template #avatar>
                <div class="size-7 rounded-full overflow-hidden border border-gray-100 dark:border-gray-800">
                  <CommonGravatar :avatar-id="user?.avatar" :size="56" />
                </div>
              </template>
            </UUser>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, loggedIn } = useUserSession();
const { isLoggingOut } = useAuth();
</script>
