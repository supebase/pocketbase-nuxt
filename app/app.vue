<template>
  <UApp>
    <UHeader :toggle="false">
      <template #title>
        <Logo />
      </template>
      <template #right>
        <UColorModeButton
          variant="ghost"
          class="w-8 h-8 rounded-full cursor-pointer" />
        <USeparator
          orientation="vertical"
          class="h-6 mx-3" />
        <User />
      </template>
    </UHeader>
    <UMain class="max-w-xl mx-auto">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>
  </UApp>
</template>
