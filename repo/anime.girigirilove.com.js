// ==MiruExtension==
// @name         girigiri爱动漫
// @version      v0.0.6
// @author       appdevelpo
// @lang         zh
// @license      MIT
// @icon         https://ani.girigirilove.com/upload/site/20230603-1/9e57505c4e140f30c70aac0cc93fa9ad.png
// @package      anime.girigirilove.com
// @type         bangumi
// @webSite      https://ani.girigirilove.com
// @nsfw         false
// ==/MiruExtension==

export default class extends Extension {
  filter_data = {};
  filter_main_bar = {};
  user_val = {};

  async load() {
    function base64decode(str) {
      var base64DecodeChars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);
      var c1, c2, c3, c4;
      var i, len, out;
      len = str.length;
      i = 0;
      out = "";
      while (i < len) {
        do {
          c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff]
        } while (i < len && c1 == -1);
        if (c1 == -1)
          break;
        do {
          c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff]
        } while (i < len && c2 == -1);
        if (c2 == -1)
          break;
        out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));
        do {
          c3 = str.charCodeAt(i++) & 0xff;
          if (c3 == 61)
            return out;
          c3 = base64DecodeChars[c3]
        } while (i < len && c3 == -1);
        if (c3 == -1)
          break;
        out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));
        do {
          c4 = str.charCodeAt(i++) & 0xff;
          if (c4 == 61)
            return out;
          c4 = base64DecodeChars[c4]
        } while (i < len && c4 == -1);
        if (c4 == -1)
          break;
        out += String.fromCharCode(((c3 & 0x03) << 6) | c4)
      }
      return out
    }
    this.base64decode = base64decode
    this.baseurl = "https://ani.girigirilove.com"
  }

  async req(url, options = {}) {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "Referer": this.baseurl + "/",
      ...(options.headers || {})
    };
    return this.request(url, {
      ...options,
      headers
    });
  }

  async search(kw, page, filter) {
    const search_str = `/search/${kw}----------${page}---/`
    const res = await this.req(search_str);
    // 新版搜索列表匹配
    const bsxList = res.match(/class="public-list-box[^"]*"[\s\S]+?<\/div>\s*<\/div>/g) || [];

    const videos = [];
    bsxList.forEach((element) => {
      const urlMatch = element.match(/href="(\/GV\d+\/)"/);
      const titleMatch = element.match(/title="([^"]+)"/);
      const coverMatch = element.match(/data-src="([^"]+)"/);
      if (urlMatch && titleMatch && coverMatch) {
        videos.push({
          title: titleMatch[1],
          url: urlMatch[1],
          cover: this.baseurl + coverMatch[1],
          headers: {
            "Referer": this.baseurl + "/"
          }
        });
      }
    });
    return videos;
  }

  async latest(page) {
    const res = await this.req(`/show/2--------${page}---/`);
    // 新版列表匹配（去掉了旧的 [swiper]）
    const bsxList = res.match(/class="public-list-box public-pic-b"[\s\S]+?<\/div>\s*<\/div>/g) || [];

    const videos = [];
    bsxList.forEach((element) => {
      const urlMatch = element.match(/href="(\/GV\d+\/)"/);
      const titleMatch = element.match(/title="([^"]+)"/);
      const coverMatch = element.match(/data-src="([^"]+)"/);
      const updateMatch = element.match(/class="public-list-prb[^"]*">([^<]+)</);
      if (urlMatch && titleMatch && coverMatch) {
        videos.push({
          title: titleMatch[1],
          url: urlMatch[1],
          cover: this.baseurl + coverMatch[1],
          update: updateMatch ? updateMatch[1].trim() : "",
          headers: {
            "Referer": this.baseurl + "/"
          }
        });
      }
    });
    return videos;
  }

  async detail(url) {
    const episodes = [];
    const web_res = await this.req(url);
    const titleMatch = web_res.match(/<h3[^>]*>([^<]+)<\/h3>/);
    const coverMatch = web_res.match(/data-src="([^"]+)"/);
    const descMatch = web_res.match(/class="text cor3"[^>]*>([^<]+)/);

    const title = titleMatch ? titleMatch[1] : "";
    const cover = coverMatch ? this.baseurl + coverMatch[1] : "";
    const desc = descMatch ? descMatch[1] : "";

    const playListArea = web_res.match(/anthology-list-play size[\s\S]+?<\/ul>/g) || [];
    const playListTitle = web_res.match(/fa ds-dianying"><\/i>.+?<span/g) || [];

    playListTitle.forEach((element, index) => {
      const streamTitleMatch = element.match(/>&nbsp;([^<]+)</);
      const stream_title = streamTitleMatch ? streamTitleMatch[1] : `线路${index + 1}`;
      if (!playListArea[index]) return;

      const ep_list = (playListArea[index].match(/<li[\s\S]+?<\/li>/g) || []).map((ep_element) => {
        const nameMatch = ep_element.match(/>([^<]+)</);
        const urlMatch = ep_element.match(/href="([^"]+)"/);
        return {
          name: nameMatch ? nameMatch[1].trim() : null,
          url: urlMatch ? urlMatch[1] : null
        };
      }).filter(ep => ep.name && ep.url);

      if (ep_list.length > 0) {
        episodes.push({
          title: stream_title,
          urls: ep_list
        });
      }
    });

    return {
      title,
      cover,
      desc,
      episodes
    };
  }

  async watch(url) {
    const m3u8 = await this.getM3u8(url);
    return {
      type: "hls",
      url: m3u8,
      headers: {
        "Referer": this.baseurl + "/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    };
  }

  async getM3u8(url) {
    const res = await this.req(url);
    const match = res.match(/player_aaaa=(.+?)<\/script>/);
    if (!match) throw new Error("无法提取播放信息");
    const vid_player_detail = JSON.parse(match[1]);
    const m3u8_link = decodeURIComponent(this.base64decode(vid_player_detail.url));
    return m3u8_link;
  }
}
