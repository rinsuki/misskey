"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const URL = require("url");
const post_1 = require("../../api/models/post");
const user_1 = require("../../api/models/user");
const text_1 = require("../../api/common/text");
process.on('unhandledRejection', console.dir);
function tokenize(text) {
    if (text == null)
        return [];
    // パース
    const ast = text_1.default(text);
    const domains = ast
        .filter(t => t.type == 'url' || t.type == 'link')
        .map(t => URL.parse(t.url).hostname);
    return domains;
}
// Fetch all users
user_1.default.find({}, {
    fields: {
        _id: true
    }
}).then(users => {
    let i = -1;
    const x = cb => {
        if (++i == users.length)
            return cb();
        extractDomainsOne(users[i]._id).then(() => x(cb), err => {
            console.error(err);
            setTimeout(() => {
                i--;
                x(cb);
            }, 1000);
        });
    };
    x(() => {
        console.log('complete');
    });
});
function extractDomainsOne(id) {
    return new Promise(async (resolve, reject) => {
        process.stdout.write(`extracting domains of ${id} ...`);
        // Fetch recent posts
        const recentPosts = await post_1.default.find({
            user_id: id,
            text: {
                $exists: true
            }
        }, {
            sort: {
                _id: -1
            },
            limit: 10000,
            fields: {
                _id: false,
                text: true
            }
        });
        // 投稿が少なかったら中断
        if (recentPosts.length < 100) {
            process.stdout.write(' >>> -\n');
            return resolve();
        }
        const domains = {};
        // Extract domains from recent posts
        recentPosts.forEach(post => {
            const domainsOfPost = tokenize(post.text);
            domainsOfPost.forEach(domain => {
                if (domains[domain]) {
                    domains[domain]++;
                }
                else {
                    domains[domain] = 1;
                }
            });
        });
        // Calc peak
        let peak = 0;
        Object.keys(domains).forEach(domain => {
            if (domains[domain] > peak)
                peak = domains[domain];
        });
        // Sort domains by frequency
        const domainsSorted = Object.keys(domains).sort((a, b) => domains[b] - domains[a]);
        // Lookup top 10 domains
        const topDomains = domainsSorted.slice(0, 10);
        process.stdout.write(' >>> ' + topDomains.join(', ') + '\n');
        // Make domains object (includes weights)
        const domainsObj = topDomains.map(domain => ({
            domain: domain,
            weight: domains[domain] / peak
        }));
        // Save
        user_1.default.update({ _id: id }, {
            $set: {
                domains: domainsObj
            }
        }).then(() => {
            resolve();
        }, err => {
            reject(err);
        });
    });
}
