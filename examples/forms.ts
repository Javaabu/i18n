import { defineComponent, h } from "vue"

/** Stands in for a form component library. */
export const Text = defineComponent({
  props: { name: { type: String, required: true }, label: { type: String, required: true } },
  setup: (props) => () => [
    h("label", { for: props.name }, props.label),
    h("input", { id: props.name, name: props.name, placeholder: props.label }),
  ],
})
