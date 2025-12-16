<template>
  <UApp>
    <NuxtLoadingIndicator />
    <UHeader :toggle="false">
      <template #title>
        <Logo />
      </template>
      <template #right>
        <Header />
      </template>
    </UHeader>

    <UMain class="max-w-md mx-auto">
      <UContainer>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </UContainer>
    </UMain>
  </UApp>
</template>
