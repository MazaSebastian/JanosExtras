import React, { useState, useRef, useEffect } from 'react';
import styles from '@/styles/CustomSelect.module.css';

export default function CustomSelect({ value, options, onChange, placeholder = 'Seleccionar...', disabled = false, required = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (option) => {
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div
            className={`${styles.selectContainer} ${disabled ? styles.disabled : ''}`}
            ref={containerRef}
            onClick={() => !disabled && setIsOpen(!isOpen)}
        >
            <div className={`${styles.selectHeader} ${isOpen ? styles.open : ''} ${!value ? styles.placeholder : ''}`}>
                <span>{options.find(o => (typeof o === 'object' ? o.value : o) === value)?.label || options.find(o => (typeof o === 'object' ? o.value : o) === value)?.value || value || placeholder}</span>
                <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
            </div>

            {/* Hidden native input for required validation if needed */}
            {required && <input type="text" style={{ opacity: 0, position: 'absolute', height: 0, width: 0, pointerEvents: 'none' }} required value={value} readOnly />}

            {isOpen && !disabled && (
                <div className={styles.dropdownList}>
                    {options.map((option, index) => {
                        const optionValue = typeof option === 'object' ? option.value : option;
                        const optionLabel = typeof option === 'object' ? option.label : option;
                        return (
                            <div
                                key={index}
                                className={`${styles.dropdownItem} ${value === optionValue ? styles.selected : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(optionValue);
                                }}
                            >
                                {optionLabel}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
