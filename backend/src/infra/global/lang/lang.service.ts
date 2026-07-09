import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

import L from '@/infra/i18n/i18n-node';
import { Locales, TranslationFunctions } from '@/infra/i18n/i18n-types';

import { DEFAULT_LANG, getTransaltionFunc } from './lang.common';

@Injectable()
export class LangService {
  private _langStorage = new AsyncLocalStorage<TranslationFunctions>();

  setLang(lang: Locales) {
    const func = getTransaltionFunc(lang);
    this._langStorage.enterWith(func);
  }

  get current() {
    return this._langStorage.getStore() ?? L[DEFAULT_LANG];
  }
}
