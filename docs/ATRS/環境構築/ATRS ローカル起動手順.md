# ATRS ローカル環境構築・起動手順

## 前提ソフトウェア

| ソフトウェア | バージョン |
|---|---|
| JDK | 8 (1.8) |
| Apache Maven | 3.8.6 |
| PostgreSQL | 14 |

> Tomcat は Maven ビルド時に自動でダウンロードされるため、個別インストール不要。

---

## 1. JDK のインストール

1. `jdk-8u351-windows-x64.exe` を実行し、ウィザードに従いインストール
   - インストール先: `C:\Program Files\Java\jdk1.8.0_351`

2. システム環境変数を設定

   | 変数 | 値 |
   |---|---|
   | `JAVA_HOME` | `C:\Program Files\Java\jdk1.8.0_351` |
   | `Path` に追加 | `C:\Program Files\Java\jdk1.8.0_351\bin` |

3. 確認
   ```
   java -version
   ```

---

## 2. Maven のインストール

1. `apache-maven-3.8.6-bin.zip` を `C:\dev\maven\` に展開
   - 展開後: `C:\dev\maven\apache-maven-3.8.6\bin`

2. システム環境変数 `Path` に追加
   ```
   C:\dev\maven\apache-maven-3.8.6\bin
   ```

3. 確認
   ```
   mvn -v
   ```

---

## 3. PostgreSQL のインストール

1. `postgresql-14.5-1-windows-x64.exe` を実行し、ウィザードに従いインストール
   - パスワード: `postgres`
   - ポート: `5432`
2. 「Stack Builder may be～」のチェックを外して完了

---

## 4. データベースの準備

### データベース作成

コマンドプロンプトで以下を実行:

```
"C:\Program Files\PostgreSQL\14\bin\psql" postgres postgres
```

パスワード `postgres` を入力後、SQL を実行:

```sql
CREATE DATABASE atrs WITH ENCODING = 'UTF8';
```

`CREATE DATABASE` と表示されたら `\q` で終了。

### テーブル作成・テストデータ投入

以下のディレクトリに移動してコマンドを実行:（**初回のみ**）

> `<ソースコードのルートディレクトリ>` は実際のパスに置き換えてください。パスにスペースが含まれる場合は `"` で囲んでください。

```
cd <ソースコードのルートディレクトリ>
mvn sql:execute -f atrs-initdb/pom.xml
```

`statements executed successfully` が表示されれば完了。

---

## 5. ビルドと起動

以下のディレクトリに移動してコマンドを順に実行:

> `<ソースコードのルートディレクトリ>` は実際のパスに置き換えてください。パスにスペースが含まれる場合は `"` で囲んでください。

```
cd <ソースコードのルートディレクトリ>
mvn clean install
mvn cargo:run -f atrs-web/pom.xml
```

`Press Ctrl-C to stop the container...` が表示されたら起動完了。

**アクセス URL**: http://localhost:8082/atrs/

終了するには `Ctrl+C`。

> **2回目以降の起動** は `mvn cargo:run -f atrs-web/pom.xml` のみでよい。
