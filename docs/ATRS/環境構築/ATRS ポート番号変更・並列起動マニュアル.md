# ATRS ポート番号変更・並列起動マニュアル

## 1. 事前チェック
作業前に以下の状態を確認してください。

* **管理者権限**: コマンドプロンプトを管理者として実行できること。
* **ポートの空き確認**: `netstat -ano | findstr :<ポート番号>` で何も表示されないこと。
* **Javaプロセスの停止**: ビルドエラーが出る場合は、一旦すべての `java.exe` を終了させるか、PCを再起動すること。

---

## 2. 設定手順
同一マシン上で複数の環境を同時に動かすには、HTTPポートだけでなく、管理用・メッセージング用ポートもセットで変更し、隔離（Isolation）する必要があります。

### ステップ1：atrs-web/pom.xml の編集
`<build>` セクション内の `cargo-maven3-plugin` 設定を以下のように修正します。

**【重要】タグの階層構造に注意してください。**
`<container>` と `<configuration>` は同じ階層（横並び）に記述します。

```xml
<plugin>
  <groupId>org.codehaus.cargo</groupId>
  <artifactId>cargo-maven3-plugin</artifactId>
  <configuration>
    <container>
      <containerId>tomcat9x</containerId>
      <type>installed</type>
      <systemProperties>
        <jms.mq.port>${jms.mq.port}</jms.mq.port>
        <app.log.dir>logs/${cargo.servlet.port}</app.log.dir>
      </systemProperties>
    </container>

    <configuration>
      <home>${project.build.directory}/cargo${cargo.servlet.port}</home>
      <properties>
        <cargo.servlet.port>${cargo.servlet.port}</cargo.servlet.port>
        <cargo.rmi.port>${cargo.rmi.port}</cargo.rmi.port>
        <cargo.tomcat.ajp.port>${cargo.tomcat.ajp.port}</cargo.tomcat.ajp.port>
        <cargo.tomcat.shutdown.port>${cargo.tomcat.shutdown.port}</cargo.tomcat.shutdown.port>
      </properties>
    </configuration>

    <deployables>
      <deployable>
        <location>${project.basedir}/target/atrs.war</location>
        <type>war</type>
        <properties>
          <context>atrs</context>
        </properties>
      </deployable>
    </deployables>
  </configuration>
</plugin>

```

### ステップ2：ポート番号の定義

`<properties>` セクションに以下の値を定義します。

| 項目 | プロパティ名 | 1号機 (予備) | 2号機 | 3号機 | 4号機 (FaRSeT) |
| --- | --- | --- | --- | --- | --- |
| **HTTPアクセス** | `cargo.servlet.port` | **8080** | 8081 | 8082 | 8083 |
| **RMI制御** | `cargo.rmi.port` | **8205** | 8206 | 8207 | 8208 |
| **AJP連携** | `cargo.tomcat.ajp.port` | **8009** | 8010 | 8011 | 8012 |
| **停止コマンド** | `cargo.tomcat.shutdown.port` | **8005** | 8006 | 8007 | 8008 |
| **ActiveMQ** | `jms.mq.port` | **61616** | 61617 | 61618 | 61619 |

---

## 3. ビルドと起動

1. **プロジェクトのビルド**: `mvn clean install`
※ `Failed to delete` エラー（ファイルロック）が出る場合は、起動中の他の環境を止めるか、PCを再起動してください。
2. **DBの初期化**: `mvn sql:execute -f atrs-initdb/pom.xml`
3. **アプリケーションの起動**: `mvn cargo:run -f atrs-web/pom.xml`

---

## 4. トラブルシューティング (FAQ)

* **「Cannot find 'configuration' in class...」が出る**
* 原因：XMLのタグが入れ子になっています。`<container>` と `<configuration>` を兄弟関係に直してください。


* **「Port number ... is in use」が出る**
* 原因：RMIポート等が重複しています。値をずらしてください。


* **「Failed to delete ... websocket-api.jar」が出る**
* 原因：他のJavaプロセスがファイルをロックしています。`java.exe` を強制終了させるか、Windowsを再起動してください。



---

## 5. 増設ルール（汎用化）

インスタンス番号を N とした場合：

* HTTP Access: 8080 + (N-1)
* RMI: 8205 + (N-1)
* ActiveMQ: 61616 + (N-1)
