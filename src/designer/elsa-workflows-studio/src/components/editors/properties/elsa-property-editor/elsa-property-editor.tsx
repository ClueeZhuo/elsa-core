import {Component, h, Prop, State, Event, EventEmitter} from '@stencil/core';
import {ActivityDefinitionProperty, ActivityPropertyDescriptor} from "../../../../models";
import {registerClickOutside} from "stencil-click-outside";
import {enter, leave, toggle} from 'el-transition'

@Component({
  tag: 'elsa-property-editor',
  styleUrl: 'elsa-property-editor.css',
  shadow: false,
})
export class ElsaPropertyEditor {

  @Event() literalValueChanged: EventEmitter<string>;
  @Prop() propertyDescriptor: ActivityPropertyDescriptor;
  @Prop() propertyModel: ActivityDefinitionProperty;
  @Prop({attribute: 'editor-height', reflect: true}) editorHeight: string = '6em';
  @Prop({attribute: 'single-line', reflect: true}) singleLineMode: boolean = false;
  @Prop({attribute: 'context', reflect: true}) context?: string;
  @State() selectedSyntax?: string;
  @State() currentValue?: string;

  contextMenu: HTMLElement;
  expressionEditor: HTMLElsaExpressionEditorElement;

  async componentWillLoad() {
    this.selectedSyntax = this.propertyModel.syntax;

    let currentValue = this.propertyModel.expressions[this.selectedSyntax ? this.selectedSyntax : 'Literal'];

    if (currentValue == undefined) {
      const defaultValue = this.propertyDescriptor.defaultValue;
      currentValue = defaultValue ? defaultValue.toString() : undefined;
    }

    this.currentValue = currentValue;
  }

  toggleContextMenu() {
    toggle(this.contextMenu);
  }

  openContextMenu() {
    enter(this.contextMenu);
  }

  closeContextMenu() {
    leave(this.contextMenu);
  }

  selectDefaultEditor(e: Event) {
    e.preventDefault();
    this.selectedSyntax = undefined;
    this.closeContextMenu();
  }

  async selectSyntax(e: Event, syntax: string) {
    e.preventDefault();

    this.propertyModel.syntax = syntax;
    this.selectedSyntax = syntax;
    this.currentValue = this.propertyModel.expressions[syntax ? syntax : 'Literal'];

    if ((!this.currentValue || this.currentValue == '') && syntax == 'Liquid')
      this.currentValue = this.propertyModel.expressions['Literal'];

    await this.expressionEditor.setExpression(this.currentValue);

    this.closeContextMenu();
  }

  mapSyntaxToLanguage(syntax: string): any {
    switch (syntax) {
      case 'JavaScript':
        return 'javascript';
      case 'Liquid':
        return 'handlebars';
      case 'Literal':
      default:
        return 'plaintext';
    }
  }

  onSettingsClick(e: Event) {
    this.toggleContextMenu();
  }

  onExpressionChanged(e: CustomEvent<string>) {
    this.propertyModel.expressions[this.selectedSyntax || 'Literal'] = e.detail;

    if (this.selectedSyntax != 'Literal')
      return;

    this.literalValueChanged.emit(e.detail);
  }

  render() {
    const propertyDescriptor = this.propertyDescriptor;
    const propertyName = propertyDescriptor.name;
    const fieldId = propertyName;
    const fieldLabel = propertyDescriptor.label || propertyName;
    const fieldHint = propertyDescriptor.hint;
    const selectedSyntax = this.selectedSyntax;
    const advancedButtonClass = selectedSyntax ? 'text-blue-500' : 'text-gray-300'

    return <div>

      <div class="mb-1">
        <div class="flex">
          <div class="flex-1">
            <label htmlFor={fieldId} class="block text-sm font-medium text-gray-700">
              {fieldLabel}
            </label>
          </div>
          <div class="relative" ref={el => registerClickOutside(this, el, this.closeContextMenu)}>
            <button type="button" class={`border-0 focus:outline-none text-sm ${advancedButtonClass}`} onClick={e => this.onSettingsClick(e)}>
              {this.renderContextMenuButton()}
            </button>
            <div>
              <div ref={el => this.contextMenu = el}
                   data-transition-enter="transition ease-out duration-100"
                   data-transition-enter-start="transform opacity-0 scale-95"
                   data-transition-enter-end="transform opacity-100 scale-100"
                   data-transition-leave="transition ease-in duration-75"
                   data-transition-leave-start="transform opacity-100 scale-100"
                   data-transition-leave-end="transform opacity-0 scale-95"
                   class="hidden origin-top-right absolute right-1 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10" role="menu"
                   aria-orientation="vertical"
                   aria-labelledby="options-menu">
                <div class="py-1" role="none">
                  <a onClick={e => this.selectSyntax(e, null)} href="#" class={`block px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 ${!selectedSyntax ? 'text-blue-700' : 'text-gray-700'}`} role="menuitem">Text</a>
                </div>
                <div class="py-1" role="none">
                  <a onClick={e => this.selectSyntax(e, 'Literal')} href="#" class={`block px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 ${selectedSyntax == 'Literal' ? 'text-blue-700' : 'text-gray-700'}`}
                     role="menuitem">Literal</a>
                  <a onClick={e => this.selectSyntax(e, 'JavaScript')} href="#" class={`block px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 ${selectedSyntax == 'JavaScript' ? 'text-blue-700' : 'text-gray-700'}`}
                     role="menuitem">JavaScript</a>
                  <a onClick={e => this.selectSyntax(e, 'Liquid')} href="#" class={`block px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 ${selectedSyntax == 'Liquid' ? 'text-blue-700' : 'text-gray-700'}`} role="menuitem">Liquid</a>
                </div>
                <div class="py-1" role="none">
                  <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">Output</a>
                  <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">Variable</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {this.renderEditor()}
      {fieldHint ? <p class="mt-2 text-sm text-gray-500">{fieldHint}</p> : undefined}
    </div>
  }

  renderContextMenuButton() {
    if (!this.selectedSyntax)
      return <svg class="h-5 w-5 text-gray-400" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z"/>
        <circle cx="12" cy="12" r="9"/>
        <line x1="8" y1="12" x2="8" y2="12.01"/>
        <line x1="12" y1="12" x2="12" y2="12.01"/>
        <line x1="16" y1="12" x2="16" y2="12.01"/>
      </svg>;

    return <span>{this.selectedSyntax}</span>;
  }

  renderEditor() {
    const propertyDescriptor = this.propertyDescriptor;
    const selectedSyntax = this.selectedSyntax;
    const monacoLanguage = this.mapSyntaxToLanguage(selectedSyntax);
    const fieldName = propertyDescriptor.name;
    const syntaxFieldName = `${fieldName}Syntax`;
    const value = this.currentValue;
    const expressionEditorClass = selectedSyntax ? 'block' : 'hidden';
    const defaultEditorClass = selectedSyntax ? 'hidden' : 'block';

    return (
      [
        <div class={expressionEditorClass}>
          <elsa-expression-editor ref={el => this.expressionEditor = el}
                                  onExpressionChanged={e => this.onExpressionChanged(e)}
                                  fieldName={fieldName}
                                  expression={value}
                                  language={monacoLanguage}
                                  editorHeight={this.editorHeight}
                                  singleLineMode={this.singleLineMode}
                                  context={this.context}/>
        </div>,
        <div class={defaultEditorClass}>
          <slot/>
        </div>,
        <input type="hidden" name={syntaxFieldName} value={selectedSyntax}/>
      ]
    );
  }
}
