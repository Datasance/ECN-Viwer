import React from "react";
import { map as lmap } from "lodash";
import {
  TextField,
  Typography,
  Button,
  Icon,
  InputAdornment,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import { theme } from "../Theme/ThemeProvider";

import { useConfig } from "../providers/Config";
import { useFeedback } from "../Utils/FeedbackContext";

const useStyles = makeStyles({
  skeleton: {
    minHeight: "55px",
  },
  link: {
    color: theme.colors.cobalt,
  },
});

export default function Config(props) {
  const classes = useStyles();
  const { config, saveConfig } = useConfig();
  const { pushFeedback } = useFeedback();
  const [tags, setTags] = React.useState(config.tags || {});
  const [filter, setFilter] = React.useState("");

  const save = async () => {
    try {
      const res = await saveConfig({ ...config, tags });
      if (res.ok) {
        pushFeedback({ message: "Saved!", type: "success" });
        props.onSave();
      } else {
       pushFeedback({ message: res.message, type: "error" });
      }
    } catch (e) {
      pushFeedback({ message: e.message, type: "error" });
    }
  };

  React.useEffect(() => {
    setTags(config.tags);
  }, [config]);

  const handleChange = (name, key) => (e) => {
    const value = e.target.value;
    setTags((tags) => ({ ...tags, [name]: { ...tags[name], [key]: value } }));
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flex: 1,
          alignItems: "baseline",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <Typography variant="h5" style={{ marginRight: "20px" }}>
            Tags
          </Typography>
          <TextField
            id="search"
            label="Search"
            onChange={(e) => setFilter(e.target.value)}
            value={filter}
            className={classes.textField}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon>search</Icon>
                </InputAdornment>
              ),
            }}
          />
        </div>
        <Typography variant="subtitle2">
          <a
            className={classes.link}
            href="https://material.io/resources/icons/?style=baseline"
            rel="noopener noreferrer"
            target="_blank"
          >
            Available Icons <Icon style={{ fontSize: 12 }}>open_in_new</Icon>
          </a>
        </Typography>
      </div>
      {lmap(tags, (tag, name) => {
        if (!name.includes(filter)) {
          return null;
        }
        return (
          <div style={{ display: "flex", alignItems: "center" }} key={name}>
            <div
              style={{
                marginRight: "10px",
                width: "150px",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <span>{name}:</span>
            </div>
            <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
              <TextField
                id="color"
                label="Color"
                onChange={handleChange(name, "color")}
                value={tag.color}
                fullWidth
                className={classes.textField}
                margin="normal"
                variant="outlined"
                type="color"
              />
              <TextField
                id="icon"
                label="Icon Name"
                onChange={handleChange(name, "icon")}
                value={tag.icon}
                fullWidth
                className={classes.textField}
                margin="normal"
                variant="outlined"
              />
            </div>
          </div>
        );
      })}
      <Button onClick={save} style={{ float: "right" }}>
        Save
      </Button>
    </div>
  );
}
