import { describe, it, expect } from 'vitest'
import { langFromFilePath } from './highlighter.ts'

describe('langFromFilePath', () => {
  it('maps .ts to typescript', () => {
    expect(langFromFilePath('src/index.ts')).toBe('typescript')
  })

  it('maps .tsx to tsx', () => {
    expect(langFromFilePath('Component.tsx')).toBe('tsx')
  })

  it('maps .js to javascript', () => {
    expect(langFromFilePath('app.js')).toBe('javascript')
  })

  it('maps .jsx to jsx', () => {
    expect(langFromFilePath('component.jsx')).toBe('jsx')
  })

  it('maps .py to python', () => {
    expect(langFromFilePath('script.py')).toBe('python')
  })

  it('maps .rb to ruby', () => {
    expect(langFromFilePath('app.rb')).toBe('ruby')
  })

  it('maps .rs to rust', () => {
    expect(langFromFilePath('main.rs')).toBe('rust')
  })

  it('maps .go to go', () => {
    expect(langFromFilePath('main.go')).toBe('go')
  })

  it('maps .java to java', () => {
    expect(langFromFilePath('App.java')).toBe('java')
  })

  it('maps .c to c', () => {
    expect(langFromFilePath('main.c')).toBe('c')
  })

  it('maps .cpp to cpp', () => {
    expect(langFromFilePath('main.cpp')).toBe('cpp')
  })

  it('maps .h to c (header)', () => {
    expect(langFromFilePath('types.h')).toBe('c')
  })

  it('maps .hpp to cpp (C++ header)', () => {
    expect(langFromFilePath('types.hpp')).toBe('cpp')
  })

  it('maps .css to css', () => {
    expect(langFromFilePath('styles.css')).toBe('css')
  })

  it('maps .html to html', () => {
    expect(langFromFilePath('index.html')).toBe('html')
  })

  it('maps .htm to html', () => {
    expect(langFromFilePath('page.htm')).toBe('html')
  })

  it('maps .json to json', () => {
    expect(langFromFilePath('package.json')).toBe('json')
  })

  it('maps .yaml and .yml to yaml', () => {
    expect(langFromFilePath('config.yaml')).toBe('yaml')
    expect(langFromFilePath('config.yml')).toBe('yaml')
  })

  it('maps .toml to toml', () => {
    expect(langFromFilePath('Cargo.toml')).toBe('toml')
  })

  it('maps .md to markdown', () => {
    expect(langFromFilePath('README.md')).toBe('markdown')
  })

  it('maps .sh, .bash, .zsh to bash', () => {
    expect(langFromFilePath('script.sh')).toBe('bash')
    expect(langFromFilePath('script.bash')).toBe('bash')
    expect(langFromFilePath('.zshrc.zsh')).toBe('bash')
  })

  it('maps .sql to sql', () => {
    expect(langFromFilePath('query.sql')).toBe('sql')
  })

  it('maps .xml to xml', () => {
    expect(langFromFilePath('data.xml')).toBe('xml')
  })

  it('maps .php to php', () => {
    expect(langFromFilePath('index.php')).toBe('php')
  })

  it('maps .diff to diff', () => {
    expect(langFromFilePath('changes.diff')).toBe('diff')
  })

  it('returns undefined for unknown extensions', () => {
    expect(langFromFilePath('file.xyz')).toBeUndefined()
  })

  it('returns undefined for files with no extension', () => {
    expect(langFromFilePath('Makefile')).toBeUndefined()
  })

  it('handles uppercase extensions case-insensitively', () => {
    expect(langFromFilePath('FILE.TS')).toBe('typescript')
    expect(langFromFilePath('data.JSON')).toBe('json')
  })

  it('handles deeply nested file paths', () => {
    expect(langFromFilePath('/home/user/projects/app/src/components/Button.tsx')).toBe('tsx')
  })

  it('handles files with multiple dots', () => {
    expect(langFromFilePath('config.test.ts')).toBe('typescript')
    expect(langFromFilePath('app.module.css')).toBe('css')
  })
})
