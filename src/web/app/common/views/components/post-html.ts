import Vue from 'vue';
import * as emojilib from 'emojilib';
import { url } from '../../../config';
import MkUrl from './url.vue';

const flatten = list => list.reduce(
	(a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []
);

export default Vue.component('mk-post-html', {
	props: {
		ast: {
			type: Array,
			required: true
		},
		shouldBreak: {
			type: Boolean,
			default: true
		},
		i: {
			type: Object,
			default: null
		}
	},
	render(createElement) {
		const els = flatten((this as any).ast.map(token => {
			switch (token.type) {
				case 'text':
					const text = token.content.replace(/(\r\n|\n|\r)/g, '\n');

					if ((this as any).shouldBreak) {
						const x = text.split('\n')
							.map(t => t == '' ? [createElement('br')] : [createElement('span', t), createElement('br')]);
						x[x.length - 1].pop();
						return x;
					} else {
						return createElement('span', text.replace(/\n/g, ' '));
					}

				case 'bold':
					return createElement('strong', token.bold);

				case 'url':
					return createElement(MkUrl, {
						props: {
							url: token.content,
							target: '_blank'
						}
					});

				case 'link':
					return createElement('a', {
						attrs: {
							class: 'link',
							href: token.url,
							target: '_blank',
							title: token.url
						}
					}, token.title);

				case 'mention':
					return (createElement as any)('a', {
						attrs: {
							href: `${url}/${token.username}`,
							target: '_blank',
							dataIsMe: (this as any).i && (this as any).i.username == token.username
						},
						directives: [{
							name: 'user-preview',
							value: token.content
						}]
					}, token.content);

				case 'hashtag':
					return createElement('a', {
						attrs: {
							href: `${url}/search?q=${token.content}`,
							target: '_blank'
						}
					}, token.content);

				case 'code':
					return createElement('pre', [
						createElement('code', {
							domProps: {
								innerHTML: token.html
							}
						})
					]);

				case 'inline-code':
					return createElement('code', token.html);

				case 'quote':
					const text2 = token.quote.replace(/(\r\n|\n|\r)/g, '\n');

					if ((this as any).shouldBreak) {
						const x = text2.split('\n')
							.map(t => [createElement('span', t), createElement('br')]);
						x[x.length - 1].pop();
						return createElement('div', {
							attrs: {
								class: 'quote'
							}
						}, x);
					} else {
						return createElement('span', {
							attrs: {
								class: 'quote'
							}
						}, text2.replace(/\n/g, ' '));
					}

				case 'emoji':
					const emoji = emojilib.lib[token.emoji];
					return createElement('span', emoji ? emoji.char : token.content);

				default:
					console.log('unknown ast type:', token.type);
			}
		}));

		const _els = [];
		els.forEach((el, i) => {
			if (el.tag == 'br') {
				if (els[i - 1].tag != 'div') {
					_els.push(el);
				}
			} else {
				_els.push(el);
			}
		});

		return createElement('span', _els);
	}
});
