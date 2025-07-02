import Select, { Props as SelectProps, GroupBase } from 'react-select';

export type CustomSelectProps<OptionType, IsMulti extends boolean = false> = SelectProps<OptionType, IsMulti, GroupBase<OptionType>> & {
    className?: string;
};

function CustomSelect<
    OptionType,
    IsMulti extends boolean = false
>({
    className,
    ...props
}: CustomSelectProps<OptionType, IsMulti>) {
    return (
        <Select<OptionType, IsMulti, GroupBase<OptionType>>
            className={className}
            {...props}
            styles={{
                control: (provided) => ({
                  ...provided,
                  backgroundColor: 'white',
                  color: 'black',
                }),
                menu: (provided) => ({
                  ...provided,
                  backgroundColor: 'white',
                  color: 'black',
                }),
                singleValue: (provided) => ({
                  ...provided,
                  color: 'black',
                }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isFocused ? '#f0f0f0' : 'white',
                  color: 'black',
                }),
              }}
        />
    );
}

export default CustomSelect;
