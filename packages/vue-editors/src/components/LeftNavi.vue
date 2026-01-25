<script lang="ts" setup>
import type { NavItem } from "../model";

interface Props {
  navItems: NavItem[];
  currentPath: string;
}

const props = defineProps<Props>();

const visibleItems = props.navItems.filter((item) => item.path !== "/");

function isActive(path: string): boolean {
  return props.currentPath === path;
}
</script>

<template>
  <div>
    <h2 class="mb-3">Available Editors:</h2>
    <div class="list-group">
      <a
        v-for="item in visibleItems"
        :key="item.path"
        :href="item.path"
        class="list-group-item list-group-item-action"
        :class="{ active: isActive(item.path) }"
      >
        <div :class="{ 'fw-bold': isActive(item.path) }">
          {{ item.label }}
        </div>
        <div class="text-muted small mb-0 mt-1">
          {{ item.description }}
        </div>
      </a>
    </div>
  </div>
</template>
