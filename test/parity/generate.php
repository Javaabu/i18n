<?php

/**
 * Runs the real Illuminate\Translation\Translator over the cases in cases.json and writes what it returns to
 * golden.json, which src/parity.test.ts compares this package against.
 */

require __DIR__.'/vendor/autoload.php';

use Illuminate\Filesystem\Filesystem;
use Illuminate\Translation\FileLoader;
use Illuminate\Translation\MessageSelector;
use Illuminate\Translation\Translator;

$translator = new Translator(new FileLoader(new Filesystem, __DIR__.'/lang'), 'en');
$translator->setFallback('en');

$strictTranslator = new Translator(new FileLoader(new Filesystem, __DIR__.'/lang'), 'en');
$strictTranslator->setFallback('');

$cases = json_decode(file_get_contents(__DIR__.'/cases.json'), true);
$results = [];

foreach ($cases['get'] as $case) {
    $translator->setLocale($case['current'] ?? 'en');
    $results['get'][] = $translator->get($case['key'], $case['replace'] ?? [], $case['locale'] ?? null);
}

foreach ($cases['choice'] as $case) {
    $translator->setLocale($case['current'] ?? 'en');
    $results['choice'][] = $translator->choice($case['key'], $case['number'], $case['replace'] ?? [], $case['locale'] ?? null);
}

foreach ($cases['has'] as $case) {
    $translator->setLocale($case['current'] ?? 'en');
    $results['has'][] = $translator->has($case['key'], $case['locale'] ?? null, $case['fallback'] ?? true);
}

foreach ($cases['noFallback'] as $case) {
    $strictTranslator->setLocale($case['current'] ?? 'en');
    $results['noFallback'][] = $strictTranslator->get($case['key'], $case['replace'] ?? [], $case['locale'] ?? null);
}

$selector = new MessageSelector;

// The same lines as the JS side loads them, in the shape `lang:js --json` writes.
foreach (['en', 'dv'] as $locale) {
    $results['langJs']["$locale.strings"] = json_decode(file_get_contents(__DIR__."/lang/$locale.json"), true);
    $results['langJs']["$locale.messages"] = include __DIR__."/lang/$locale/messages.php";
}

$results['langJs']['en.dir.sub'] = include __DIR__.'/lang/en/dir/sub.php';

foreach ($cases['select'] as $case) {
    $results['select'][] = $selector->choose($case['line'], $case['number'], $case['locale']);
}

// Every locale in Laravel's plural table, read from its own source so a new one shows up here.
$source = file_get_contents((new ReflectionClass(MessageSelector::class))->getFileName());
preg_match_all("/case '([^']+)':/", $source, $matches);
$locales = array_values(array_unique($matches[1]));
$locales[] = 'dv';

$numbers = [0, 1, 2, 3, 4, 5, 8, 10, 11, 12, 14, 19, 20, 21, 22, 25, 99, 100, 101, 102, 103, 111, 112, 1000, 1.5, -1];
$results['plural'] = ['numbers' => $numbers, 'locales' => []];

foreach ($locales as $locale) {
    $results['plural']['locales'][$locale] = array_map(fn ($number) => $selector->getPluralIndex($locale, $number), $numbers);
}

file_put_contents(
    __DIR__.'/golden.json',
    json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION)."\n",
);

echo 'Wrote golden.json'.PHP_EOL;
