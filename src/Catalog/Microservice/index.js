import React from 'react'
import { makeStyles } from '@material-ui/styles'
import ReactJson from '../../Utils/ReactJson'
import yaml from 'js-yaml'
import { Menu, MenuItem, Divider } from '@material-ui/core'

import { ControllerContext } from '../../ControllerProvider'
import { FeedbackContext } from '../../Utils/FeedbackContext'
import Modal from '../../Utils/Modal'
import CatalogTable from './CatalogTable'
import AddCatalogItemForm from './AddCatalogItemForm'
import Confirm from '../../Utils/Confirm'
import FileDrop from '../../Utils/FileDrop'

import lget from 'lodash/get'

const useStyles = makeStyles(theme => ({
  pointer: {
    cursor: 'pointer'
  },
  container: {
    padding: '10px 50px 10px 30px'
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column'
  },
  titleRow: {
    marginBottom: '30px'
  },
  link: {
    color: theme.palette.text.primary,
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline'
    }
  },
  hiddenInput: {
    width: '0.1px',
    height: '0.1px',
    opacity: 0,
    overflow: 'hidden',
    position: 'absolute',
    zIndex: '-1'
  }
}))

const mapImages = (images) => {
  const supportedPlatforms = []
  for (const img of images) {
    if (img.containerImage) {
      switch (img.fogTypeId) {
        case 1:
          supportedPlatforms.push('x86')
          break
        case 2:
          supportedPlatforms.push('arm')
          break
        default:
          break
      }
    }
  }
  return supportedPlatforms
}
const mapCatalogItem = (item, registries) => {
  item.supportedPlatforms = mapImages(item.images)
  item.registry = registries.find(r => r.id === item.registryId)
  if (item.configExample) {
    try {
      item.configExample = JSON.parse(item.configExample)
    } catch (e) {
    }
  }
  return item
}

const getRegistryIdFromRegistry = (registry) => {
  if (registry === 'remote') {
    return 1
  }
  if (registry === 'local') {
    return 2
  }
  return +(registry)
}

const parseCatalogItem = (doc) => {
  if (doc.apiVersion !== 'datasance.com/v1') {
    return [{}, `Invalid API Version ${doc.apiVersion}, current version is datasance.com/v1`]
  }
  if (doc.kind !== 'CatalogItem') {
    return [{}, `Invalid kind ${doc.kind}`]
  }
  if (!doc.metadata || !doc.spec) {
    return [{}, 'Invalid YAML format']
  }
  const catalogItem = {
    name: lget(doc, 'metadata.name', lget(doc, 'spec.name', undefined)),
    images: {
      x86: lget(doc, 'spec.x86', ''),
      arm: lget(doc, 'spec.arm', '')
    },
    description: lget(doc, 'spec.description', ''),
    publisher: lget(doc, 'spec.publisher', ''),
    category: lget(doc, 'spec.category', ''),
    registry: lget(doc, 'spec.registry', ''),
    configExample: lget(doc, 'spec.configExample', {})
  }

  catalogItem.registryId = catalogItem.registry ? getRegistryIdFromRegistry(catalogItem.registry) : 1
  return [catalogItem]
}

export default function Catalog () {
  const classes = useStyles()
  const [openDetailsModal, setOpenDetailsModal] = React.useState(false)
  const [openRemoveConfirm, setOpenRemoveConfirm] = React.useState(false)
  const [openAddCatalogItemModal, setOpenAddCatalogItemModal] = React.useState(false)
  const [newCatalogItem, setNewCatalogItem] = React.useState(null)
  const [fetching, setFetching] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [catalog, setCatalog] = React.useState([])
  const [registries, setRegistries] = React.useState([])
  const [selectedItem, setSelectedItem] = React.useState({})
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null)
  const { request } = React.useContext(ControllerContext)
  const { pushFeedback } = React.useContext(FeedbackContext)

  const handleCloseMenu = () => setMenuAnchorEl(null)
  const openMenu = (item, e) => {
    setSelectedItem(item)
    setMenuAnchorEl(e.currentTarget)
  }
  const openDetails = () => {
    setOpenDetailsModal(true)
    handleCloseMenu()
  }
  const openRemove = () => {
    setOpenRemoveConfirm(true)
    handleCloseMenu()
  }

  async function fetchCatalog () {
    try {
      setFetching(true)
      const catalogItemsResponse = await request('/api/v1/catalog/microservices')
      if (!catalogItemsResponse.ok) {
        pushFeedback({ message: catalogItemsResponse.statusText, type: 'error' })
        setFetching(false)
        return
      }
      let catalogItems = (await catalogItemsResponse.json()).catalogItems
      const registriesResponse = await request('/api/v1/registries')
      if (!registriesResponse.ok) {
        pushFeedback({ message: registriesResponse.statusText, type: 'error' })
        setFetching(false)
        return
      }
      const registries = (await registriesResponse.json()).registries
      catalogItems = catalogItems.map(item => mapCatalogItem(item, registries))
      setCatalog(catalogItems)
      setRegistries(registries)
      setFetching(false)
    } catch (e) {
      pushFeedback({ message: e.message, type: 'error' })
      setFetching(false)
    }
  }

  React.useEffect(() => {
    fetchCatalog()
  }, [])

  const addCatalogItem = async (item) => {
    const newItem = {
      ...item,
      images: [{
        fogTypeId: 1,
        containerImage: item.images.x86
      }, {
        fogTypeId: 2,
        containerImage: item.images.arm
      }]
    }
    if (newItem.configExample && typeof newItem.configExample === typeof ({})) {
      newItem.configExample = JSON.stringify(newItem.configExample)
    }
    setLoading(true)
    const response = await request('/api/v1/catalog/microservices', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newItem)
    })
    if (response.ok) {
      pushFeedback({ message: 'Item added to the Catalog!', type: 'success' })
      newItem.id = (await response.json()).id
      setCatalog([mapCatalogItem(newItem, registries), ...catalog])
      setLoading(false)
    } else {
      pushFeedback({ message: response.statusText, type: 'error' })
      setLoading(false)
    }
  }

  const removeCatalogItem = async (item) => {
    try {
      setLoading(true)
      const res = await request(`/api/v1/catalog/microservices/${item.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        pushFeedback({ message: res.statusText, type: 'error' })
      } else {
        setCatalog(catalog.filter(i => i.id !== item.id))
        pushFeedback({ message: 'Catalog item deleted', type: 'success' })
      }
      setLoading(false)
    } catch (e) {
      pushFeedback({ message: e.message, type: 'error', uuid: 'error' })
      setLoading(false)
    }
  }

  const readCatalogItemFile = async (item) => {
    const file = item.files[0]
    if (file) {
      const reader = new window.FileReader()

      reader.onload = function (evt) {
        try {
          const doc = yaml.load(evt.target.result)
          const [catalogItem, err] = parseCatalogItem(doc)
          if (err) {
            return pushFeedback({ message: err, type: 'error' })
          }
          setNewCatalogItem(catalogItem)
          setOpenAddCatalogItemModal(true)
        } catch (e) {
          console.error({ e })
          pushFeedback({ message: 'Could not parse the file', type: 'error' })
        }
      }

      reader.onerror = function (evt) {
        pushFeedback({ message: evt, type: 'error' })
      }

      reader.readAsText(file, 'UTF-8')
    }
  }

  return (
    <>
      <div className={classes.container}>
        <CatalogTable {...{ loading: fetching, openMenu, catalog }} />
        <div>
          <FileDrop {...{ onDrop: readCatalogItemFile }}>
            <div className={classes.flexColumn}>
              <input onChange={(e) => readCatalogItemFile(e.target)} class='box__file' type='file' name='files[]' id='file' className={classes.hiddenInput} />
              <span>
                <label for='file' className={classes.link} style={{ marginRight: '5px' }}>Choose a file</label>
    or Drag a file here to update the catalog
              </span>
            </div>
          </FileDrop>
        </div>
      </div>
      <Modal
        {...{
          open: openDetailsModal,
          title: `${selectedItem.name} details`,
          onClose: () => setOpenDetailsModal(false)
        }}
      >
        <ReactJson title='Catalog item' src={selectedItem} name={false} />
      </Modal>
      <Modal
        {...{
          open: openAddCatalogItemModal,
          title: 'Add an item to the Catalog',
          onClose: () => setOpenAddCatalogItemModal(false)
        }}
      >
        <AddCatalogItemForm {...{
          loading,
          registries,
          newCatalogItem,
          onSave: async (item) => {
            try {
              await addCatalogItem(item)
              setNewCatalogItem(null)
              setOpenAddCatalogItemModal(false)
            } catch (e) {
              pushFeedback({ message: e.message, type: 'error' })
            }
          }
        }}
        />
      </Modal>
      <Confirm
        open={openRemoveConfirm}
        title={`Delete catalog item ${selectedItem.name} ?`}
        onClose={() => setOpenRemoveConfirm(false)}
        onConfirm={() => {
          removeCatalogItem(selectedItem)
          setOpenRemoveConfirm(false)
        }}
        description='This is not reversible.'
      />
      <Menu
        id='catalog-menu'
        anchorEl={menuAnchorEl}
        keepMounted
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={openDetails}>Details</MenuItem>
        <Divider />
        <MenuItem onClick={openRemove}>Remove item</MenuItem>
      </Menu>
    </>
  )
}
