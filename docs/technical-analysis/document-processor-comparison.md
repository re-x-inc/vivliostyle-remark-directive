# Document Processor 比較表

## 作成した Document Processor の一覧と比較

| ファイル名                              | アプローチ                         | remark-directive 対応 | HTML 生成      | VFM 機能 | ビルド動作 | プレビュー | 複雑度 |
| --------------------------------------- | ---------------------------------- | --------------------- | -------------- | -------- | ---------- | ---------- | ------ |
| `document-processor.js`                 | 基本的な unified パイプライン      | ✅                    | ❌ (body のみ) | ❌       | ✅         | ❓         | 低     |
| `document-processor-complete.js`        | 完全な HTML 生成を含むパイプライン | ✅                    | ✅             | 一部     | ✅         | ❓         | 高     |
| `document-processor-debug.js`           | デバッグ用ラッパー                 | ❌                    | -              | ✅       | ✅         | ❓         | 低     |
| `document-processor-fixed.js`           | rehype-document を使用             | ✅                    | ✅             | ❌       | ❌         | ❓         | 中     |
| `document-processor-inject.js`          | VFM にプラグイン注入               | ❌                    | ✅             | ✅       | ✅         | ❓         | 高     |
| `document-processor-minimal.js`         | 最小限の VFM ラッパー              | ❌                    | ✅             | ✅       | ✅         | ❓         | 最低   |
| `document-processor-minimal-process.js` | process メソッドのみ               | ❌                    | ✅             | ✅       | ✅         | ❓         | 最低   |
| `document-processor-pure-function.js`   | 純粋関数実装                       | ❌                    | ✅             | ✅       | ✅         | ❓         | 低     |
| `document-processor-sync.js`            | 同期処理のみ                       | ✅                    | ✅             | ✅       | 未テスト   | ❓         | 高     |
| `document-processor-unified.js`         | VFM.use()でプラグイン追加          | ❌                    | ✅             | ✅       | ✅         | ❓         | 中     |
| `document-processor-vfm-compatible.js`  | VFM ラッパー＋プラグイン           | ❌                    | ✅             | ✅       | ✅         | ❓         | 中     |
| `document-processor-vfm-early.js`       | VFM attachers 操作                 | ❌                    | ✅             | ✅       | ✅         | ❓         | 高     |
| **`document-processor-vfm-exact.js`**   | **前処理 →VFM**                    | **✅**                | **✅**         | **✅**   | **✅**     | **❓**     | **中** |
| `document-processor-vfm-native.js`      | VFM プラグイン再実装               | ✅                    | ✅             | 一部     | ❌         | ❓         | 最高   |

## 採用推奨表

### 🏆 推奨: `document-processor-vfm-exact.js`

**理由:**

1. ✅ remark-directive を確実に処理
2. ✅ VFM の全機能を維持（完全な HTML、セクション構造、ID 生成など）
3. ✅ ビルドが安定して動作
4. ✅ 実装が理解しやすく、メンテナンスが容易
5. ✅ デバッグ出力を制御可能

**アプローチ:**

1. remark-directive で Markdown を前処理
2. directive を通常の HTML に変換
3. 変換済み Markdown を VFM で処理

### 📋 その他の選択肢

| 優先度 | ファイル                     | 使用場面                                       |
| ------ | ---------------------------- | ---------------------------------------------- |
| 2      | `document-processor.js`      | VFM 機能が不要で、シンプルな変換のみ必要な場合 |
| 3      | `document-processor-sync.js` | 非同期処理を避けたい場合（未完成）             |
| -      | その他                       | 実験的/デバッグ用途のみ                        |

### ❌ 非推奨

- VFM へのプラグイン注入系（inject, unified, early）: VFM が freeze されているため動作しない
- minimal 系: remark-directive に対応していない
- fixed/complete: VFM の機能を再実装しており、互換性に問題がある

## プレビューのハング問題について

- **原因**: DocumentProcessor とは無関係（DocumentProcessor なしでもハング）
- **回避策**: `npm run build`でビルドして確認
- **今後**: 環境依存の問題として別途調査が必要
