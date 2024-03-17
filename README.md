# CloudFront & S3 & API Gateway & WAF サンプル

## 構成

[![構成図](./docs/cloudfront-s3-api-waf-sample.drawio.png)]

## 初期設定

- ルートディレクトリで`npm ci`を実行する
- cdkディレクトリで`npm ci`を実行する
- frontendディレクトリで`npm ci`を実行する

## ローカル実行

- front/.env.templateをコピーしてfront/.envを作成する
  - `VITE_API_ENDPOINT`に`http://localhost:3000`を設定する
- ルートディレクトリで `npm run start-front:local` でフロントエンドを起動する
- ルートディレクトリで `npm run start-api:local` でAPIを起動する
  - ※Lambdaを修正した場合は、再度実行する必要がある、CDKの場合にsam buildコマンドなどでの自動反映方法が不明のため
- 動作確認
  - `http://localhost:5173`でアクセスする
  - 取得ボタンをクリックする

## デプロイ

- ルートディレクトリで `npm run deploy-all:dev` でデプロイ
- 動作確認
  - CloudFrontのURLでアクセスする
  - 取得ボタンをクリックする

## 削除

- S3のログバケットを空にする
  - cloudfront-s3-api-waf-dev-cloudfront-log-bucket
- ルートディレクトリで `npm run destroy-all:dev` で削除
- CloudWatch Logsにロググループが残っているので手動で削除する
  - `cloudfront-s3-api-waf` で検索して削除する
  - 作成時刻を確認し対象と判断できる `/aws/codebuild/FrontDeployDeployToSourceBu-xxxxx` を削除する
  - 作成時刻を確認し対象と判断できる `API-Gateway-Execution-Logs_xxxxxxx/api` を削除する
- IAMロールが残っているので手動で削除する
  - `cloudfront-s3-api-waf` で検索して削除する