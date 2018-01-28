## THD scripts

### `cli`

This runs google cloud functions locally. Use `./cli run the_function_name` to execute. Function names are without `thd_` and are currently:

* `categories` - makes JSON for the latest categories in the DB
* `topics` - All topic items from db -> buckets. This also fetches the pages `content_url` html and stores it.
* `topic_items` - All tools, materials, text, etc. relating to a topic. They are keyed off the `content_url`
* `topic_items_location` - Pulls current aisle/bin location from items and stores back into the record. If this is manual, you should run this and then `topic_items` after.
* `store_topic_item_images` - Grabs and stores all the topic item image URLs in bucket storage.

### `gen_font`

This script takes the `font.config.json` and generates a new web font. Use this file on fontello to product a similar typeface
