<template>
  <UApp>
    <NuxtLoadingIndicator />
    <UHeader :toggle="false">
      <template #right>
        <Header />
      </template>
    </UHeader>

    <UMain>
      <UContainer>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </UContainer>
    </UMain>
  </UApp>
</template>
