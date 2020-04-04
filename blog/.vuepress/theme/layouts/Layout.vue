<template>
  <div>
    <post-list v-if="$pagination" />
    <Content v-else />
  </div>
</template>
<script>
import PostList from "../components/PostList";
export default {
  components: {
    "post-list": PostList
  }
};
</script>
