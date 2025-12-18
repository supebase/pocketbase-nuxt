<template>
  <div>
    <div class="flex items-center gap-3">
      <UButton
        to="/auth"
        color="neutral"
        variant="link"
        icon="hugeicons:lock-key"
        class="rounded-full"
        v-if="!loggedIn" />

      <div
        class="flex items-center gap-3"
        v-else>
        <UUser
          :name="user?.name"
          size="sm">
          <template #avatar>
            <div class="size-8 rounded-full overflow-hidden">
              <CommonGravatar
                :avatar-id="user?.avatar"
                :size="64" />
            </div>
          </template>
        </UUser>

        <USeparator
          orientation="vertical"
          class="h-6 ml-2" />

        <UButton
          to="/new"
          color="neutral"
          variant="link"
          icon="i-hugeicons:add-circle"
          class="rounded-full"
          v-if="user?.verified" />

        <AuthLogoutButton />
      </div>
      <CommonColorModeButton />
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, loggedIn } = useUserSession();
</script>
