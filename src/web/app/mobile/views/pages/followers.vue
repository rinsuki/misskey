<template>
<mk-ui>
	<template slot="header" v-if="!fetching">
		<img :src="`${user.avatar_url}?thumbnail&size=64`" alt="">
		{{ '%i18n:mobile.tags.mk-user-followers-page.followers-of%'.replace('{}', user.name) }}
	</template>
	<mk-users-list
		v-if="!fetching"
		:fetch="fetchUsers"
		:count="user.followers_count"
		:you-know-count="user.followers_you_know_count"
		@loaded="onLoaded"
	>
		%i18n:mobile.tags.mk-user-followers.no-users%
	</mk-users-list>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	data() {
		return {
			fetching: true,
			user: null
		};
	},
	watch: {
		$route: 'fetch'
	},
	created() {
		this.fetch();
	},
	mounted() {
		document.documentElement.style.background = '#313a42';
	},
	methods: {
		fetch() {
			Progress.start();
			this.fetching = true;

			(this as any).api('users/show', {
				username: this.$route.params.user
			}).then(user => {
				this.user = user;
				this.fetching = false;

				document.title = '%i18n:mobile.tags.mk-user-followers-page.followers-of%'.replace('{}', user.name) + ' | Misskey';
			});
		},
		onLoaded() {
			Progress.done();
		},
		fetchUsers(iknow, limit, cursor, cb) {
			(this as any).api('users/followers', {
				user_id: this.user.id,
				iknow: iknow,
				limit: limit,
				cursor: cursor ? cursor : undefined
			}).then(cb);
		}
	}
});
</script>
