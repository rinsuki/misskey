<template>
<mk-ui>
	<span slot="header">%fa:R comments%%i18n:mobile.tags.mk-messaging-page.message%</span>
	<mk-messaging @navigate="navigate" :header-top="48"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	mounted() {
		document.title = 'Misskey %i18n:mobile.tags.mk-messaging-page.message%';
		document.documentElement.style.background = '#fff';
	},
	methods: {
		navigate(user) {
			(this as any).$router.push(`/i/messaging/${user.username}`);
		}
	}
});
</script>
