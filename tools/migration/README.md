Misskeyの破壊的変更に対応するいくつかのスニペットがあります。
MongoDBシェルで実行する必要のあるものとnodeで直接実行する必要のあるものがあります。
ファイル名が `shell.` から始まるものは前者、 `node.` から始まるものは後者です。

MongoDBシェルで実行する場合、`use`でデータベースを選択しておく必要があります。

nodeで実行するいくつかのスニペットは、並列処理させる数を引数で設定できるものがあります。
処理中にエラーで落ちる場合は、メモリが足りていない可能性があるので、少ない数に設定してみてください。
※デフォルトは`5`です。

ファイルを作成する際は `../init-migration-file.sh -t _type_ -n _name_` を実行すると _type_._unixtime_._name_.js が生成されます
