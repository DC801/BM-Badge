import { defineUserConfig } from 'vuepress'
import { shikiPlugin } from '@vuepress/plugin-shiki'
import { readFileSync } from "fs"

console.log('shikiPlugin', shikiPlugin)

const myGrammar = JSON.parse(readFileSync("mgs.tmLanguage.json"))
const myLanguage = {
  id: "MageGameScript",
  scopeName: 'source.mgs',
  grammar: myGrammar,
  aliases: ['mgs'],
}
const jsonGrammar = JSON.parse(readFileSync("node_modules/shiki/languages/json.tmLanguage.json"))
const jsonLanguage = {
  id: "JSON",
  scopeName: 'source.json',
  grammar: jsonGrammar,
  aliases: ['json'],
}

export default defineUserConfig({
  lang: 'en-US',
  title: 'Mage Game Engine Documentation',
  description: 'Documentation for the DC801 Black Mage Game Engine',
  markdown: {
    code: {
      lineNumbers: false
    }
  },
  plugins: [
    shikiPlugin({
      langs: [ myLanguage, jsonLanguage ],
      theme: 'dark-plus',
    }),
  ],
})
