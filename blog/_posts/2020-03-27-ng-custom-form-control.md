---
date: 2020-03-27
tags:
    - Angular
    - ng5
    - 表单
author: guojam
---

# ng 自定义表单控件

## 一. 实现自定义表单控件

### 1. ControlValueAccessor 接口

要实现自定义表单控件，需要实现[ControlValueAccessor](https://angular.io/api/forms/ControlValueAccessor) 接口。
该接口定义了四个方法

```ts
interface ControlValueAccessor {
    writeValue(obj: any): void
    registerOnChange(fn: any): void
    registerOnTouched(fn: any): void
    setDisabledState(isDisabled: boolean)?: void
}
```

### 2. 具体实现

以下实现一个自定义 radio group

```ts
/**
 * file: form-radio-group.component.ts
 */
import { Component, forwardRef, Input } from '@angular/core';
import {
    ControlValueAccessor,
    FormControl,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
} from '@angular/forms';

const controlValueAccessor = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => FormRadioGroupComponent),
    multi: true,
};
// 如果要在内部定义验证器，需在组件元数据providers设置该对象
const controlValidators = {
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => FormRadioGroupComponent),
    multi: true,
};

/** 自定义表单radio group组件 */
@Component({
    selector: 'app-form-radio-group',
    template: `
        <ng-container *ngFor="let item of items; let i = index">
            <input
                type="radio"
                name="{{ name }}"
                id="{{ radioName + i }}"
                [value]="item.value"
                [checked]="item.value === value"
                [disabled]="disabled"
                (change)="valueChanged($event, item)"
            />
            <label for="{{ radioName + i }}">
                {{ item.label }}
            </label>
        </ng-container>
    `,
    styleUrls: ['./form-radio-group.component.scss'],
    providers: [controlValueAccessor, controlValidators],
})
export class FormRadioGroupComponent implements ControlValueAccessor {
    // ...

    /** radio group name */
    @Input()
    name: string;

    /** radio data */
    @Input()
    items: { value: string; label: string }[] = [];

    disabled: boolean;
    value: string;
    private onChange = (_: string) => {};
    private onTouched = () => {};

    /** 实现ControlValueAccessor接口的4个方法 ------start */
    writeValue(value: string): void {
        this.value = value;
        this.onChange(this.value);
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
    /** 实现ControlValueAccessor接口的4个方法 ------end */

    get radioName() {
        return 'radio_' + this.name + '_';
    }

    valueChanged(event, item) {
        this.writeValue(item.value);
    }

    /** 控件自定义验证方法 */
    validate(control: FormControl) {
        const valid = !!control.value;
        return valid
            ? null
            : {
                  required: {
                      valid: false,
                      text: '不能为空',
                  },
              };
    }
}
```

### 3. 在父组件添加验证器

要在自定义表单控件内校验，需要实现 validate 方法。如果未实现 validate 方法，可在父组件创建该 formControl 时设置验证器。

```html
<!-- parent.component.html -->
<form
    [formGroup]="formGroup"
    (ngSubmit)="onSubmit()"
    novalidate
    autocomplete="off"
>
    <div class="ui-form-item">
        <label class="ui-label">性别</label>
        <app-form-radio-group
            formControlName="inputRadioGender"
            [name]="'gender'"
            [items]="genderRadioOptions"
        ></app-form-radio-group>
    </div>
</form>
```

```ts
/**
 * file: parent.component.ts
 */
// import ...

@Component({
    templateUrl: './parent.component.html',
    styleUrls: ['./parent.component.scss'],
})
export class ParentComponent implements AfterContentInit {
    formGroup: FormGroup;

    /** 性别 radio控件选项 */
    genderRadioOptions = [
        {
            label: '男',
            value: 'male',
        },
        {
            label: '女',
            value: 'female',
        },
        {
            label: '未知',
            value: 'other',
        },
    ];

    constructor(private fb: FormBuilder) {}

    ngAfterContentInit() {
        this.initForm();
    }

    /**
     * 初始化表单
     */
    initForm() {
        this.formGroup = this.fb.group({
            // 单选框group组件
            inputRadioGender: ['', [Validators.required]],
        });
    }

    // ...
}
```

## 二. 给已实例化的表单控件设置验证方法

如表单控件实例化时未指定验证方法，也可在实例化之后再添加验证。

### 设置同步验证方法

可以这样给控件设置同步验证方法：`control.setValidators(newValidatorFn);`

`newValidatorFn` 会覆盖该控件上已存在的任何同步验证器。

可以通过重新设置已有规则来保留已有规则

```ts
// ...
class ParentComponent {
    // ...

    /**
     * 给表单控件添加新验证器的方法
     * @param control AbstractControl控件
     * @param fns ValidatorFn验证函数数组
     */
    addValidation(control: AbstractControl, fns: ValidatorFn[]) {
        control.setValidators([
            control.validator, // 保留原有的同步验证器
            ...fns
        ]);
    }
    /**
     * 初始化表单
     */
    initForm() {
        this.formGroup = this.fb.group({
            // 自定义组件, formControlName为'customControlFieldName', 初始值'defaultValue', 设置验证方法Validators.required
            customControlFieldName: ['defaultValue', [Validators.required]]
        });

        // 定义一个新验证器
        const newValidator = ()=>{
            return (control: FormControl)=>{
                const value = control.value;
                let valid;
                // valid = ... // 根据规则验证
                return valid? null: {
                    newValidatorRuleName: {
                        invalid: true
                    }
                }
            }
        }
        // 获取自定义控件实例
        const customControl = this.formGroup.get('customControlFieldName');
        // 添加新的验证规则
        this.addValidation(customControl, [newValidator]);
    }
```

### 设置异步验证方法

设置异步验证器同理，只要用 `setAsyncValidators` 方法替换 `setValidators` 方法

参考: [别再对 Angular Form 的 ControlValueAccessor 感到迷惑](https://zhuanlan.zhihu.com/p/97564854)
