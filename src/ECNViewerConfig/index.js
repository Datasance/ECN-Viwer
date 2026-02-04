import React from "react";
import { map as lmap } from "lodash";
import { TextField, Typography, Button, InputAdornment } from "@mui/material";
import { Search, ExternalLink } from "lucide-react";
import { theme } from "../Theme/ThemeProvider";

import { useConfig } from "../providers/Config";
import { useFeedback } from "../Utils/FeedbackContext";

export default function Config(props) {
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
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
          />
        </div>
        <Typography variant="subtitle2">
          <a
            href="https://material.io/resources/icons/?style=baseline"
            rel="noopener noreferrer"
            target="_blank"
            style={{ color: theme.colors.cobalt, textDecoration: "none" }}
          >
            Available Icons{" "}
            <ExternalLink size={12} style={{ verticalAlign: "middle" }} />
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
