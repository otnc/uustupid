export const en = {
  'meta.title': 'uustupid — UUID-shaped, never a UUID',
  'meta.description':
    'A generator for UUID-shaped random strings that can never collide with a valid RFC 9562 UUID.',

  'hero.tagline': 'It looks like a UUID. It can never be one.',
  'hero.lead':
    'All 32 hex digits come from Web Crypto. The two nibbles RFC 9562 reserves are then moved out of its reach and kept there — far enough that no future revision of the spec could turn a value into a UUID after the fact.',
  'hero.regenerate': 'Regenerate',
  'hero.copy': 'Copy',
  'hero.langLabel': 'Language',
  'hero.copied': 'Copied',
  'hero.copyFailed': 'Could not copy — select the value and copy it yourself',
  'hero.warning':
    'This is not a UUID. Never use it where a real UUID is expected. It is for jokes, mocks and fixtures.',

  'bulk.title': 'Generate in bulk',
  'bulk.count': 'How many',
  'bulk.generate': 'Generate',
  'bulk.copyAll': 'Copy all',
  'bulk.hint': 'Click to copy',

  'method.title': 'Out of range, and out of reach',
  'method.lead':
    'The version nibble is one of the eight RFC 9562 leaves unassigned, and the variant always has the one bit its 10xx pattern can never have. That is enough today — but 9 through f are unassigned, not unassignable. If the RFC ever gives one of them a meaning, only the variant would still be holding the line, so those versions are paired exclusively with the 0xxx variant space, which NCS backward compatibility already spent. Version 0 needs no such help: the Nil UUID owns it forever.',
  'method.note':
    'Neither special UUID can come out, and neither needs a guard: Nil would need a zero byte where the variant bit now sits, and Max would need an f variant, which only version 0 can pair with. Everything else is untouched randomness — all 16 values show up in each of the other 30 digits.',

  'anatomy.title': 'Why this is not a UUID',
  'anatomy.lead':
    'Out of 36 characters, RFC 9562 assigns meaning to two. Either one may land on a value the RFC uses — but never both at once, and that is the whole trick.',
  'anatomy.rfcUses': 'RFC 9562 uses',
  'anatomy.thisValue': 'this value',
  'anatomy.version': 'version (index 14)',
  'anatomy.variant': 'variant (index 19)',
  'anatomy.inRange': 'in range',
  'anatomy.outOfRange': 'out of range',
  'anatomy.conclusion':
    'Both out of range, at the same time, every time. That is the whole reason this is not a UUID — a validator only has to read one of them to say no.',
  'anatomy.note':
    'Highlighted above: the version nibble at index 14 and the variant nibble at index 19. The other 34 characters are ordinary random hex.',

  'verify.title': 'See for yourself',
  'verify.lead':
    'Both values below were fed to an RFC 9562 validator embedded in this page. That validator shares no code with the package.',
  'verify.valid': 'Valid UUID',
  'verify.invalid': 'Not a UUID',
  'verify.note': 'Fresh values on every load. The verdicts never swap around.',
  'verify.libraries': 'What the ecosystem says',
  'verify.librariesLead':
    'Every validator below was given the same 100 uustupids and the same 100 real UUIDs while this page was built. A tick means all 100 answers were the expected ones. A cross means at least one was not, and the number says how many of the 100 were wrong.',
  'verify.strict': 'Rejected every uustupid',
  'verify.strictLead':
    'These read the version and variant that RFC 9562 reserves, so not one uustupid got through.',
  'verify.loose': 'Called a uustupid a UUID',
  'verify.looseLead':
    'These accepted at least one uustupid. The last column says whether the library means to.',
  'verify.col.package': 'Package',
  'verify.col.validator': 'Validator',
  'verify.col.intended': 'Intended',
  'verify.rejectedAll': 'Rejected all',
  'verify.acceptedAll': 'Accepted all',
  'verify.accepted': 'Accepted',
  'verify.rejected': 'Rejected',
  'verify.intended.yes': 'Yes.',
  'verify.intended.no': 'No.',
  'verify.reason.jsonSchema':
    'JSON Schema defines format "uuid" as a syntax check, and its official test suite requires an undefined version and variant to pass.',
  'verify.reason.guid': 'Accepts GUID-style strings, not only RFC 9562 UUIDs.',
  'verify.reason.loose': 'An explicitly loose mode that checks only the shape.',
  'verify.reason.bytes': 'Treats a UUID as any 128-bit value, whatever its version and variant.',
  'verify.reason.legacy':
    'An older major version. The current major reads the version and variant.',
  'verify.reason.shapeOnly':
    'Checks only the 8-4-4-4-12 shape and never reads the version or variant.',
  'verify.librariesNote':
    'Each version shown is the one installed when the page was built. If a library changes its behavior, it simply moves to the other table on the next build: nothing fails. None of these libraries reach your browser.',

  'install.title': 'Install',
  'install.note':
    'No dependencies, one entry point, under 3 kB. Runs on Node.js 22+, browsers, Cloudflare Workers, Deno and Bun.',
  'install.usage': 'Usage',

  'footer.builtWith': 'The generator on this page uses the very package published to npm.',
  'footer.license': 'WTFPL',
}

export type Key = keyof typeof en

export const ja: Record<Key, string> = {
  'meta.title': 'uustupid — UUID の見た目、UUID じゃない',
  'meta.description':
    '有効な RFC 9562 UUID と決して被らない、UUID そっくりのランダム文字列ジェネレーター。',

  'hero.tagline': 'UUID の見た目。UUID には決してならない。',
  'hero.lead':
    '32 桁はすべて Web Crypto の乱数です。RFC 9562 が予約している 2 桁だけを範囲の外へ出し、そこに留めます — 将来 RFC が改訂されても、後から有効な UUID になってしまわない位置まで。',
  'hero.regenerate': '再生成',
  'hero.copy': 'コピー',
  'hero.langLabel': '表示言語',
  'hero.copied': 'コピーしました',
  'hero.copyFailed': 'コピーできませんでした — 値を選択して手動でコピーしてください',
  'hero.warning':
    'これは UUID ではありません。UUID が必要な場所では使わないでください。用途はジョーク、モック、テストデータです。',

  'bulk.title': 'まとめて生成',
  'bulk.count': '個数',
  'bulk.generate': '生成',
  'bulk.copyAll': 'すべてコピー',
  'bulk.hint': 'クリックでコピー',

  'method.title': '範囲の外へ、そして手の届かない場所へ',
  'method.lead':
    'version ニブルは RFC 9562 が割り当てていない 8 通りのいずれか、variant は 10xx が決して持てないビットを常に立てます。今日はこれで十分です — ただし 9〜f は「未割り当て」であって「割り当て不能」ではありません。将来どれかに意味が与えられたら、残るのは variant だけになる。だからそれらの version には、NCS 後方互換が既に使い切った 0xxx の variant だけを組み合わせます。version 0 にはこの手当ては不要です — Nil UUID が永久に押さえているからです。',
  'method.note':
    '2 つの特殊な UUID はどちらも出ませんし、そのためのガードも要りません。Nil は variant のビットがある位置に 0 が必要で、Max は variant が f である必要がありますが、それと組めるのは version 0 だけだからです。それ以外は手つかずの乱数で、他の 30 桁には 16 通りすべてが出ます。',

  'anatomy.title': 'なぜ UUID ではないのか',
  'anatomy.lead':
    '36 文字のうち RFC が意味を決めているのは 2 桁。どちらか片方が RFC の使う値に入ることはあります — ただし両方同時には決して入りません。仕掛けはそれだけです。',
  'anatomy.rfcUses': 'RFC 9562 が使う値',
  'anatomy.thisValue': 'この値',
  'anatomy.version': 'version（14 文字目）',
  'anatomy.variant': 'variant（19 文字目）',
  'anatomy.inRange': '範囲内',
  'anatomy.outOfRange': '範囲外',
  'anatomy.conclusion':
    'この 2 つが毎回、同時に範囲外です。UUID でない理由はそれだけ — 検証器はどちらか一方を読むだけで「違う」と言えます。',
  'anatomy.note':
    '上で色を付けているのが 14 文字目の version ニブルと 19 文字目の variant ニブルです。残り 34 文字はただの乱数の 16 進数です。',

  'verify.title': '検証してみる',
  'verify.lead':
    'このページに埋め込んだ RFC 9562 検証器に食わせた結果です。検証器はパッケージのコードを一切使っていません。',
  'verify.valid': '有効な UUID',
  'verify.invalid': '無効な UUID',
  'verify.note': '読み込むたびに新しい値で判定しています。何度試しても結果は入れ替わりません。',
  'verify.libraries': 'エコシステムの判定',
  'verify.librariesLead':
    'このページのビルド時に、どの検証器にも同じ 100 個の uustupid と、同じ 100 個の本物の UUID を食わせた結果です。✓ は 100 回すべて想定どおりに判定したこと、✗ は一度でも想定と違う判定をしたことを表し、数字は 100 回中の誤判定の回数です。',
  'verify.strict': 'uustupid をすべて弾いた検証器',
  'verify.strictLead':
    'RFC 9562 が予約している version と variant を読むので、uustupid を 1 つも通しませんでした。',
  'verify.loose': 'uustupid を UUID と判定した検証器',
  'verify.looseLead':
    '1 つでも uustupid を通したものです。最後の列は、それがライブラリの意図した挙動かどうかです。',
  'verify.col.package': 'パッケージ',
  'verify.col.validator': '検証器',
  'verify.col.intended': '意図された挙動か',
  'verify.rejectedAll': 'すべて弾いた',
  'verify.acceptedAll': 'すべて通した',
  'verify.accepted': '通した',
  'verify.rejected': '弾いた',
  'verify.intended.yes': 'はい。',
  'verify.intended.no': 'いいえ。',
  'verify.reason.jsonSchema':
    'JSON Schema は format "uuid" を構文のチェックと定めており、公式テストスイートが未定義の version と variant を有効とするよう要求しています。',
  'verify.reason.guid': 'RFC 9562 の UUID に限らず、GUID 形式の文字列も受け入れる設計です。',
  'verify.reason.loose': '形だけを見ると明示された緩いモードです。',
  'verify.reason.bytes':
    'version や variant に関係なく、UUID を任意の 128 ビット値として扱います。',
  'verify.reason.legacy': '旧メジャー版です。現行のメジャー版は version と variant を読みます。',
  'verify.reason.shapeOnly': '8-4-4-4-12 の形だけを見ていて、version も variant も読んでいません。',
  'verify.librariesNote':
    'バージョンは、ページのビルド時にインストールされていたものです。ライブラリの挙動が変われば、次のビルドでもう一方の表に移るだけで、何も失敗しません。これらのライブラリがブラウザに届くことはありません。',

  'install.title': 'インストール',
  'install.note':
    '依存ゼロ、エントリ 1 本、3 kB 未満。Node.js 22+ / ブラウザ / Cloudflare Workers / Deno / Bun で動きます。',
  'install.usage': '使い方',

  'footer.builtWith':
    'このページのジェネレーターは npm で配布している uustupid そのものを使っています。',
  'footer.license': 'WTFPL',
}
