import React from 'react'
import Downshift from 'downshift'
import deburr from 'lodash/deburr'
import get from 'lodash/get'
import { MenuItem, Paper, TextField } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    height: 250
  },
  container: {
    flexGrow: 1,
    position: 'relative'
  },
  paper: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing(1),
    marginBot: theme.spacing(2),
    left: 0,
    right: 0,
    maxHeight: '250px',
    overflowY: 'scroll'
  },
  chip: {
    margin: theme.spacing(0.5, 0.25)
  },
  inputRoot: {
    flexWrap: 'wrap'
  },
  inputInput: {
    width: 'auto',
    flexGrow: 1
  },
  divider: {
    height: theme.spacing(2)
  }
}))

function renderInput (inputProps) {
  const { InputProps, classes, ref, ...others } = inputProps
  return (
    <TextField
      InputProps={{
        inputRef: ref,
        classes: {
          root: classes.inputRoot,
          input: classes.inputInput
        },
        ...InputProps
      }}
      {...others}
    />
  )
}

function renderSuggestion (suggestionProps) {
  const { suggestion, index, itemProps, highlightedIndex, selectedItem } = suggestionProps
  const isHighlighted = highlightedIndex === index
  const isSelected = (selectedItem || {}).label === suggestion.label

  return (
    <MenuItem
      {...itemProps}
      key={suggestion.label}
      selected={isHighlighted}
      component='div'
      style={{
        fontWeight: isSelected ? 500 : 400
      }}
    >
      {suggestion.label}
    </MenuItem>
  )
}

export default function Autocomplete (props) {
  const classes = useStyles()

  const getSuggestions = (value, { showEmpty = false } = {}) => {
    const inputValue = deburr(value.trim()).toLowerCase()
    const inputLength = inputValue.length
    let count = 0

    return inputLength === 0 && !showEmpty
      ? []
      : props.suggestions.filter(suggestion => {
        const keep = count < props.maxSuggestions && suggestion.label.toLowerCase().startsWith(inputValue.toLowerCase())
        if (keep) {
          count += 1
        }
        return keep
      })
  }

  return (
    <Downshift
      itemToString={item => get(item, 'label', '')}
      onChange={props.onChange}
      initialSelectedItem={props.initialSelectedItem}
      {...(props.selectedItem ? { selectedItem: props.selectedItem } : {})}
      id='downshift-options'
    >
      {({
        clearSelection,
        getInputProps,
        getItemProps,
        getLabelProps,
        getMenuProps,
        highlightedIndex,
        inputValue,
        isOpen,
        openMenu,
        selectedItem
      }) => {
        const { onBlur, onChange, onFocus, ...inputProps } = getInputProps({
          onChange: event => {
            if (event.target.value === '') {
              clearSelection()
            }
          },
          onFocus: openMenu,
          disabled: props.disabled || false,
          placeholder: props.placeholder || ''
        })

        return (
          <div className={classes.container}>
            {renderInput({
              fullWidth: true,
              classes,
              label: props.label,
              InputLabelProps: getLabelProps({ shrink: true }),
              InputProps: { onBlur, onChange, onFocus },
              inputProps
            })}

            <div {...getMenuProps()}>
              {isOpen ? (
                <Paper className={classes.paper} square>
                  {getSuggestions(inputValue, { showEmpty: true }).map((suggestion, index) =>
                    renderSuggestion({
                      suggestion,
                      index,
                      itemProps: getItemProps({ item: suggestion }),
                      highlightedIndex,
                      selectedItem
                    })
                  )}
                </Paper>
              ) : null}
            </div>
          </div>
        )
      }}
    </Downshift>
  )
}
