"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bayes = require('./naive-bayes.js');
const MeCab = require('./mecab');
const post_1 = require("../../api/models/post");
/**
 * 投稿を学習したり与えられた投稿のカテゴリを予測します
 */
class Categorizer {
    constructor() {
        this.mecab = new MeCab();
        // BIND -----------------------------------
        this.tokenizer = this.tokenizer.bind(this);
    }
    tokenizer(text) {
        const tokens = this.mecab.parseSync(text)
            .filter(token => token[1] === '名詞')
            .map(token => token[0]);
        return tokens;
    }
    async init() {
        this.classifier = bayes({
            tokenizer: this.tokenizer
        });
        // 訓練データ取得
        const verifiedPosts = await post_1.default.find({
            is_category_verified: true
        });
        // 学習
        verifiedPosts.forEach(post => {
            this.classifier.learn(post.text, post.category);
        });
    }
    async predict(text) {
        return this.classifier.categorize(text);
    }
}
exports.default = Categorizer;
