<template>
  <component :is="iconComponent" :size="size" :color="color" :class="iconClass" />
</template>

<script setup>
import { computed, h } from 'vue'
import * as LucideIcons from 'lucide-vue-next'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [Number, String],
    default: 24
  },
  color: {
    type: String,
    default: 'currentColor'
  },
  class: {
    type: String,
    default: ''
  }
})

const iconClass = computed(() => props.class)

const iconComponent = computed(() => {
  // Convertir le nom en PascalCase (ex: "user-plus" -> "UserPlus")
  const iconName = props.name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
  
  // Chercher l'icône dans Lucide
  const Icon = LucideIcons[iconName]
  
  if (!Icon) {
    console.warn(`Icon "${props.name}" (${iconName}) not found in Lucide Icons`)
    // Retourner une icône par défaut (Circle)
    return h(LucideIcons.Circle, {
      size: props.size,
      color: props.color,
      class: iconClass.value
    })
  }
  
  return h(Icon, {
    size: props.size,
    color: props.color,
    class: iconClass.value
  })
})
</script>

