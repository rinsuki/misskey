<template>
<div class="sub">
	<router-link class="avatar-anchor" :to="`/${post.user.username}`">
		<img class="avatar" :src="`${post.user.avatar_url}?thumbnail&size=96`" alt="avatar"/>
	</router-link>
	<div class="main">
		<header>
			<router-link class="name" :to="`/${post.user.username}`">{{ post.user.name }}</router-link>
			<span class="username">@{{ post.user.username }}</span>
			<router-link class="created-at" :to="`/${post.user.username}/${post.id}`">
				<mk-time :time="post.created_at"/>
			</router-link>
		</header>
		<div class="body">
			<mk-sub-post-content class="text" :post="post"/>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['post']
});
</script>

<style lang="stylus" scoped>
.sub
	font-size 0.9em
	padding 16px

	&:after
		content ""
		display block
		clear both

	> .avatar-anchor
		display block
		float left
		margin 0 10px 0 0

		@media (min-width 500px)
			margin-right 16px

		> .avatar
			display block
			width 44px
			height 44px
			margin 0
			border-radius 8px
			vertical-align bottom

			@media (min-width 500px)
				width 52px
				height 52px

	> .main
		float left
		width calc(100% - 54px)

		@media (min-width 500px)
			width calc(100% - 68px)

		> header
			display flex
			margin-bottom 2px
			white-space nowrap

			> .name
				display block
				margin 0 0.5em 0 0
				padding 0
				overflow hidden
				color #607073
				font-size 1em
				font-weight 700
				text-align left
				text-decoration none
				text-overflow ellipsis

				&:hover
					text-decoration underline

			> .username
				text-align left
				margin 0
				color #d1d8da

			> .created-at
				margin-left auto
				color #b2b8bb

		> .body

			> .text
				cursor default
				margin 0
				padding 0
				font-size 1.1em
				color #717171

				pre
					max-height 120px
					font-size 80%

</style>

