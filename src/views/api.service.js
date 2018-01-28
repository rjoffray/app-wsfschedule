window.angular.module('appWsfschedule')
  .provider('oakApi', function () {
    const _ = window.lodash
    let _this = this
    let { api: Api } = window.tools
    _this.getApi = function () {
      if (_this.api) return _this.api
      let api = new Api(
        '/spec/assets',
        function (err, { v1, v2 }) {
          if (err) return console.error(err)
          _this.v1 = v1
          _this.v2 = v2
          return { v1, v2 }
        }
      )
      _this.api = api
      return api
    }

    function init () {
      return _this.getApi()
    }

    this.store = function (id) {
      return _this.v2
        .store({
          store_id: id
        })
        .then(res => res.body)
    }

    this.categories = function ($q) {
      return _this.v2
        .allCategories()
        .then(function (res) {
          return $q.all(
            _.map(res.body, t => _this.category(t.name))
          )
        })
    }

    this.category = function (id) {
      id = _.snakeCase(id)
      return _this.v2
        .category({ id })
        .then(res => res.body)
    }

    this.topics = function ($q, category) {
      category = _.snakeCase(category)
      return _this.v2
        .topicsInCategory({ category })
        .then(function (res) {
          return $q.all(
            _.map(res.body, t => _this.topic(category, t.name))
          )
        })
    }

    this.topic = function (category, id) {
      category = _.snakeCase(category)
      return _this.v2
        .topic({ category, id })
        .then(res => res.body)
    }

    this.topicItems = function ($q, category, id) {
      category = _.snakeCase(category)
      return _this.topic(category, id).then(topic => {
        let contentUrl = _.snakeCase(topic.content_url)
        return _this.v2
          .topicItemsInContentUrl({
            content_url: contentUrl
          })
          .then(function (res) {
            return $q.all(
              _.map(res.body, t => {
                return _this.topicItem(contentUrl, t.name)
                  .then(item => {
                    item.md5 = t.name
                    return item
                  })
                  .catch(e => {
                    return {}
                  })
              })
            )
          })
          .catch(e => {
            return {}
          })
      })
    }

    this.topicItem = function (contentUrl, md5) {
      contentUrl = _.snakeCase(contentUrl)
      return _this.v2
        .topic_item({
          content_url: contentUrl,
          md5
        })
        .then(res => res.body)
    }

    this.location = function (md5, storeId) {
      return _this.v2
        .location({ md5 })
        .then(res => res.body[storeId])
        .catch(e => {
          return null
        })
    }

    this.link = function (contentUrl) {
      return _this.v2
        .link({
          content_url: _.snakeCase(contentUrl)
        })
        .then(res => res.body)
    }

    this.init = init
    this.$get = function () {
      return {
        init: this.init,
        store: this.store,
        category: this.category,
        categories: this.categories,
        topic: this.topic,
        topics: this.topics,
        topicItem: this.topicItem,
        topicItems: this.topicItems,
        location: this.location,
        link: this.link
      }
    }
    return this
  })
