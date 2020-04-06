<template>
  <li class="post-tag">
    <router-link :to="'/tag/' + tag">{{ tag }}</router-link>
  </li>
</template>

<script>
export default {
  name: "PostTag",
  props: {
    tag: {
      type: String,
      required: true
    }
  }
};
</script>

<style scoped lang="stylus">
.post-tag {
  background-color: $postTagBgColor;
  height: 20px;
  padding: 0 10px;
  position: relative;
  cursor: pointer;
  font-size: 12px;

  &:not(:last-child) {
    margin-right: 10px;
  }

  a {
    color: $postTagColor;
    text-decoration: none;
    transition: color 0.2s;
  }

  &:hover {
    background-color: $accentColor;

    a {
      color: #fff;
    }
  }
}
</style>
