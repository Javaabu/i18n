<?php

return [
    'welcome' => 'Welcome, :name',
    'greeting' => ':Name says :NAME and :name',
    'only_english' => 'Only in English',
    'empty' => '',
    'number' => 42,
    'emptyGroup' => [],
    'prefix' => ':short and :shorter',
    'link' => 'Read the <terms>terms</terms> and <privacy>policy</privacy>',
    'literal.dotted' => 'A key with a dot',
    'nested' => [
        'deep' => [
            'line' => 'Deep :what',
            'other' => 'Other :what',
        ],
    ],
    'apples' => 'There is one apple|There are many apples',
    'apples_count' => '{0} No apples|{1} One apple|[2,10] A few (:count) apples|[11,*] Lots of apples: :count',
    'below' => '[*,0] None or fewer|[1,*] Some',
    'mixed' => '{1} Exactly one|Fallthrough singular|Fallthrough plural',
    'spaced' => '{1}   padded   |[2,*]   more   ',
    'three' => 'one|few|many',
    'multiline' => "{0} none\nsecond line|[1,*] some\nsecond line",
    'number_key' => 'Value :0 and :1',
];
