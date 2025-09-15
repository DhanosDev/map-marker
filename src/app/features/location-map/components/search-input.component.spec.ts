import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import {
  SearchInputComponent,
  SelectOption,
  SearchInputType,
} from './search-input.component';

describe('SearchInputComponent', () => {
  let component: SearchInputComponent;
  let fixture: ComponentFixture<SearchInputComponent>;
  let compiled: HTMLElement;

  const mockOptions: SelectOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchInputComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;

    // Set default inputs
    fixture.componentRef.setInput('options', mockOptions);
    fixture.componentRef.setInput('type', 'country');
    fixture.componentRef.setInput('placeholder', 'Seleccionar...');
    fixture.componentRef.setInput('isLoading', false);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.type()).toBe('country');
      expect(component.options()).toEqual(mockOptions);
      expect(component.placeholder()).toBe('Seleccionar...');
      expect(component.isLoading()).toBe(false);
      expect(component.selectedValue()).toBeUndefined();
      expect(component.isFocused()).toBe(false);
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    it('should display placeholder when no value is selected', () => {
      expect(component.displayText()).toBe('Seleccionar...');
    });

    it('should display selected value when value is set', () => {
      fixture.componentRef.setInput('selectedValue', 'option1');
      fixture.detectChanges();
      expect(component.displayText()).toBe('option1');
    });
  });

  describe('Dropdown Functionality', () => {
    it('should toggle dropdown when button is clicked', () => {
      const button = compiled.querySelector(
        'button[role="combobox"]'
      ) as HTMLButtonElement;

      expect(component.isOpen()).toBe(false);

      button.click();
      expect(component.isOpen()).toBe(true);

      button.click();
      expect(component.isOpen()).toBe(false);
    });

    it('should open dropdown on Enter key', () => {
      const button = compiled.querySelector(
        'button[role="combobox"]'
      ) as HTMLButtonElement;
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });

      button.dispatchEvent(enterEvent);
      expect(component.isOpen()).toBe(true);
    });

    it('should open dropdown on Space key', () => {
      const button = compiled.querySelector(
        'button[role="combobox"]'
      ) as HTMLButtonElement;
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      spyOn(spaceEvent, 'preventDefault');

      button.dispatchEvent(spaceEvent);
      expect(spaceEvent.preventDefault).toHaveBeenCalled();
      expect(component.isOpen()).toBe(true);
    });

    it('should open dropdown on ArrowDown key', () => {
      const button = compiled.querySelector(
        'button[role="combobox"]'
      ) as HTMLButtonElement;
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      spyOn(arrowDownEvent, 'preventDefault');

      button.dispatchEvent(arrowDownEvent);
      expect(arrowDownEvent.preventDefault).toHaveBeenCalled();
      expect(component.isOpen()).toBe(true);
    });

    it('should close dropdown on Escape key', () => {
      component.openDropdown();
      expect(component.isOpen()).toBe(true);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      compiled.dispatchEvent(escapeEvent);
      expect(component.isOpen()).toBe(false);
    });

    it('should not open dropdown when loading', () => {
      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();

      component.toggleDropdown();
      expect(component.isOpen()).toBe(false);

      component.openDropdown();
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('Option Selection', () => {
    beforeEach(() => {
      component.openDropdown();
      fixture.detectChanges();
    });

    it('should emit valueSelected when option is clicked', () => {
      spyOn(component.valueSelected, 'emit');

      const optionButtons = compiled.querySelectorAll('button[role="option"]');
      const firstOption = optionButtons[0] as HTMLButtonElement;

      firstOption.click();

      expect(component.valueSelected.emit).toHaveBeenCalledWith('option1');
      expect(component.isOpen()).toBe(false);
    });

    it('should emit valueSelected on Enter key for option', () => {
      spyOn(component.valueSelected, 'emit');

      const optionButtons = compiled.querySelectorAll('button[role="option"]');
      const firstOption = optionButtons[0] as HTMLButtonElement;
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });

      firstOption.dispatchEvent(enterEvent);

      expect(component.valueSelected.emit).toHaveBeenCalledWith('option1');
    });

    it('should emit valueSelected on Space key for option', () => {
      spyOn(component.valueSelected, 'emit');

      const optionButtons = compiled.querySelectorAll('button[role="option"]');
      const firstOption = optionButtons[0] as HTMLButtonElement;
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      spyOn(spaceEvent, 'preventDefault');

      firstOption.dispatchEvent(spaceEvent);

      expect(spaceEvent.preventDefault).toHaveBeenCalled();
      expect(component.valueSelected.emit).toHaveBeenCalledWith('option1');
    });
  });

  describe('Focus Handling', () => {
    it('should set focused state on focus', () => {
      const button = compiled.querySelector(
        'button[role="combobox"]'
      ) as HTMLButtonElement;

      button.focus();
      expect(component.isFocused()).toBe(true);
    });

    it('should clear focused state and close dropdown on blur', (done) => {
      const button = compiled.querySelector(
        'button[role="combobox"]'
      ) as HTMLButtonElement;
      component.openDropdown();

      button.dispatchEvent(new Event('blur'));
      expect(component.isFocused()).toBe(false);

      // Check dropdown closes after timeout
      setTimeout(() => {
        expect(component.isOpen()).toBe(false);
        done();
      }, 200);
    });
  });

  describe('Outside Click Handling', () => {
    it('should close dropdown when clicking outside', () => {
      component.openDropdown();
      expect(component.isOpen()).toBe(true);

      // Simulate click outside
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);

      const clickEvent = new Event('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {
        value: outsideElement,
        enumerable: true,
      });

      document.dispatchEvent(clickEvent);

      expect(component.isOpen()).toBe(false);

      document.body.removeChild(outsideElement);
    });

    it('should not close dropdown when clicking inside', () => {
      component.openDropdown();
      expect(component.isOpen()).toBe(true);

      const button = compiled.querySelector(
        'button[role="combobox"]'
      ) as HTMLButtonElement;
      const clickEvent = new Event('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', {
        value: button,
        enumerable: true,
      });

      document.dispatchEvent(clickEvent);

      expect(component.isOpen()).toBe(true);
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();
    });

    it('should show loading spinner when loading', () => {
      const spinner = compiled.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });

    it('should hide dropdown arrow when loading', () => {
      const arrow = compiled.querySelector('svg');
      expect(arrow).toBeFalsy();
    });

    it('should disable button when loading', () => {
      const button = compiled.querySelector(
        'button[role="combobox"]'
      ) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      expect(button.classList.contains('opacity-50')).toBe(true);
    });

    it('should not show dropdown when loading', () => {
      const dropdown = compiled.querySelector('[role="listbox"]');
      expect(dropdown).toBeFalsy();
    });
  });

  describe('Template Rendering', () => {
    it('should render correct placeholder text', () => {
      const button = compiled.querySelector(
        'button[role="combobox"]'
      ) as HTMLButtonElement;
      expect(button.textContent?.trim()).toBe('Seleccionar...');
    });

    it('should render options when dropdown is open', () => {
      component.openDropdown();
      fixture.detectChanges();

      const options = compiled.querySelectorAll('button[role="option"]');
      expect(options.length).toBe(3);
      expect(options[0].textContent?.trim()).toBe('Option 1');
      expect(options[1].textContent?.trim()).toBe('Option 2');
      expect(options[2].textContent?.trim()).toBe('Option 3');
    });

    it('should show empty state when no options available', () => {
      fixture.componentRef.setInput('options', []);
      component.openDropdown();
      fixture.detectChanges();

      const emptyState = compiled.querySelector('[role="status"]');
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent?.trim()).toBe('No hay países disponibles');
    });

    it('should show city empty state for city type', () => {
      fixture.componentRef.setInput('type', 'city');
      fixture.componentRef.setInput('options', []);
      component.openDropdown();
      fixture.detectChanges();

      const emptyState = compiled.querySelector('[role="status"]');
      expect(emptyState?.textContent?.trim()).toBe(
        'No hay ciudades disponibles'
      );
    });

    it('should highlight selected option', () => {
      fixture.componentRef.setInput('selectedValue', 'option2');
      component.openDropdown();
      fixture.detectChanges();

      const options = compiled.querySelectorAll('button[role="option"]');
      const selectedOption = options[1] as HTMLButtonElement;

      expect(selectedOption.classList.contains('bg-blue-600')).toBe(true);
      expect(selectedOption.getAttribute('aria-selected')).toBe('true');
    });

    it('should rotate arrow when dropdown is open', () => {
      const arrow = compiled.querySelector('svg');
      expect(arrow?.classList.contains('rotate-180')).toBe(false);

      component.openDropdown();
      fixture.detectChanges();

      expect(arrow?.classList.contains('rotate-180')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on combobox', () => {
      fixture.detectChanges();
      const button = compiled.querySelector(
        'button[role="combobox"]'
      ) as HTMLButtonElement;

      expect(button.getAttribute('role')).toBe('combobox');
      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.getAttribute('aria-haspopup')).toBe('listbox');
      expect(button.getAttribute('aria-label')).toBe('Select country');
    });

    it('should update aria-expanded when dropdown opens', () => {
      const button = compiled.querySelector(
        'button[role="combobox"]'
      ) as HTMLButtonElement;

      component.openDropdown();
      fixture.detectChanges();

      expect(button.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have proper ARIA attributes on listbox', () => {
      component.openDropdown();
      fixture.detectChanges();

      const listbox = compiled.querySelector('[role="listbox"]') as HTMLElement;
      expect(listbox.getAttribute('role')).toBe('listbox');
      expect(listbox.getAttribute('aria-label')).toBe('Country options');
    });

    it('should have proper ARIA attributes on options', () => {
      component.openDropdown();
      fixture.detectChanges();

      const options = compiled.querySelectorAll('button[role="option"]');
      options.forEach((option) => {
        expect(option.getAttribute('role')).toBe('option');
        expect(option.getAttribute('aria-selected')).toBeDefined();
      });
    });

    it('should change aria-label based on type', () => {
      fixture.componentRef.setInput('type', 'city');
      fixture.detectChanges();

      const button = compiled.querySelector(
        'button[role="combobox"]'
      ) as HTMLButtonElement;
      expect(button.getAttribute('aria-label')).toBe('Select city');

      component.openDropdown();
      fixture.detectChanges();

      const listbox = compiled.querySelector('[role="listbox"]') as HTMLElement;
      expect(listbox.getAttribute('aria-label')).toBe('City options');
    });
  });

  describe('Public API Methods', () => {
    it('should provide toggleDropdown method', () => {
      expect(component.isOpen()).toBe(false);
      component.toggleDropdown();
      expect(component.isOpen()).toBe(true);
      component.toggleDropdown();
      expect(component.isOpen()).toBe(false);
    });

    it('should provide openDropdown method', () => {
      expect(component.isOpen()).toBe(false);
      component.openDropdown();
      expect(component.isOpen()).toBe(true);
    });

    it('should provide closeDropdown method', () => {
      component.openDropdown();
      expect(component.isOpen()).toBe(true);
      component.closeDropdown();
      expect(component.isOpen()).toBe(false);
    });

    it('should provide selectOption method', () => {
      spyOn(component.valueSelected, 'emit');
      component.openDropdown();

      component.selectOption('test-value');

      expect(component.isOpen()).toBe(false);
      expect(component.valueSelected.emit).toHaveBeenCalledWith('test-value');
    });
  });
});
