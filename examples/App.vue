<script setup lang="ts">
import { useTranslation } from "@javaabu/i18n/vue"
import * as Forms from "./forms"

const { locale, setLocale } = useTranslation()
</script>

<template>
  <nav>
    <button id="switch" @click="setLocale(locale === 'dv' ? 'en' : 'dv')">{{ __("Switch language") }}</button>
  </nav>
  <h1>{{ __("Welcome, :name!", { name: "Ali" }) }}</h1>
  <p>{{ trans_choice("messages.unread", 3) }}</p>
  <Forms.Text name="message" :label="__('Message')" />
</template>
