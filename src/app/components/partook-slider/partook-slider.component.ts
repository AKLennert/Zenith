import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-partook-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partook-slider.component.html',
  styleUrl: './partook-slider.component.scss'
})
export class PartookSliderComponent implements OnChanges {
  @Input() value: boolean | null = null;
  @Output() valueChange = new EventEmitter<boolean | null>();

  // 'left' = ripped (true), 'right' = clean (false), 'center' = unset (null)
  position: 'left' | 'center' | 'right' = 'center';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value']) {
      if (this.value === true) this.position = 'left';
      else if (this.value === false) this.position = 'right';
      else this.position = 'center';
    }
  }

  selectLeft() {
    if (this.position === 'left') {
      // Deselect
      this.position = 'center';
      this.valueChange.emit(null);
    } else {
      this.position = 'left';
      this.valueChange.emit(true);
    }
  }

  selectRight() {
    if (this.position === 'right') {
      this.position = 'center';
      this.valueChange.emit(null);
    } else {
      this.position = 'right';
      this.valueChange.emit(false);
    }
  }
}
