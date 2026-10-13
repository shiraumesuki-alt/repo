// ==MiruExtension==
// @name         girigiri爱动漫
// @version      v0.1.0
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
    // 正确的 base64 解码
    this.base64decode = function (str) {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      let output = "";
      str = str.replace(/[^A-Za-z0-9\+\/]/g, "");
      for (let i = 0; i < str.length; i += 4) {
        const enc1 = chars.indexOf(str.charAt(i));
        const enc2 = chars.indexOf(str.charAt(i + 1));
        const enc3 = chars.indexOf(str.charAt(i + 2));
        const enc4 = chars.indexOf(str.charAt(i + 3));

        const chr1 = (enc1 << 2) | (enc2 >> 4);
        const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        const chr3 = ((enc3 & 3) << 6) | enc4;

        output += String.fromCharCode(chr1);
        if (enc3 !== -1) output += String.fromCharCode(chr2);
        if (enc4 !== -1) output += String.fromCharCode(chr3);
      }
      return output;
    };

    this.baseurl = "https://ani.girigirilove.com";
  }

  async req(url, options = {}) {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      Referer: this.baseurl + "/",
      ...(options.headers || {}),
    };
    return this.request(url, {
      ...options,
      headers,
    });
  }

  async search(kw, page, filter) {
    // 使用真正有效的 suggest 搜索接口
    const api = `/index.php/ajax/suggest?mid=1&wd=${encodeURIComponent(
      kw
    )}&limit=20`;
    const res = await this.req(api, {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
    });

    let data;
    try {
      data = typeof res === "string" ? JSON.parse(res) : res;
    } catch (e) {
      console.log("search parse error", e);
      return [];
    }

    if (!data || !data.list) return [];

    return data.list.map((item) => {
      let cover = item.pic || "";
      if (cover && !cover.startsWith("http")) {
        cover = this.baseurl + cover;
      }
      return {
        title: item.name,
        url: `/GV${item.id}/`,
        cover: cover,
        headers: {
          Referer: this.baseurl + "/",
        },
      };
    });
  }

  async latest(page) {
    const res = await this.req(`/show/2--------${page}---/`);
    const bsxList =
      res.match(
        /class="public-list-box public-pic-b"[\s\S]+?<\/div>\s*<\/div>/g
      ) || [];

    const videos = [];
    bsxList.forEach((element) => {
      const urlMatch = element.match(/href="(\/GV\d+\/)"/);
      const titleMatch = element.match(/title="([^"]+)"/);
      const coverMatch = element.match(/data-src="([^"]+)"/);
      const updateMatch = element.match(
        /class="public-list-prb[^"]*">([^<]+)</
      );
      if (urlMatch && titleMatch && coverMatch) {
        videos.push({
          title: titleMatch[1],
          url: urlMatch[1],
          cover: this.baseurl + coverMatch[1],
          update: updateMatch ? updateMatch[1].trim() : "",
          headers: {
            Referer: this.baseurl + "/",
          },
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

    const playListArea =
      web_res.match(/anthology-list-play size[\s\S]+?<\/ul>/g) || [];
    const playListTitle =
      web_res.match(/fa ds-dianying"><\/i>.+?<span/g) || [];

    playListTitle.forEach((element, index) => {
      const streamTitleMatch = element.match(/>&nbsp;([^<]+)</);
      const stream_title = streamTitleMatch
        ? streamTitleMatch[1]
        : `线路${index + 1}`;
      if (!playListArea[index]) return;

      const ep_list = (playListArea[index].match(/<li[\s\S]+?<\/li>/g) || [])
        .map((ep_element) => {
          const nameMatch = ep_element.match(/>([^<]+)</);
          const urlMatch = ep_element.match(/href="([^"]+)"/);
          return {
            name: nameMatch ? nameMatch[1].trim() : null,
            url: urlMatch ? urlMatch[1] : null,
          };
        })
        .filter((ep) => ep.name && ep.url);

      if (ep_list.length > 0) {
        episodes.push({
          title: stream_title,
          urls: ep_list,
        });
      }
    });

    return {
      title,
      cover,
      desc,
      episodes,
    };
  }

  async watch(url) {
    const m3u8 = await this.getM3u8(url);
    return {
      type: "hls",
      url: m3u8,
      headers: {
        Referer: this.baseurl + "/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    };
  }

  // 手动匹配完整 JSON 对象
  extractPlayerData(html) {
    const key = "player_aaaa";
    const idx = html.indexOf(key);
    if (idx === -1) return null;

    let start = html.indexOf("{", idx);
    if (start === -1) return null;

    let depth = 0;
    let end = -1;
    for (let i = start; i < html.length; i++) {
      const ch = html[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }

    if (end === -1) return null;
    return html.substring(start, end + 1);
  }

  async getM3u8(url) {
    const res = await this.req(url);

    const jsonStr = this.extractPlayerData(res);
    if (!jsonStr) {
      throw new Error("无法提取播放信息 player_aaaa");
    }

    let vid_player_detail;
    try {
      vid_player_detail = JSON.parse(jsonStr);
    } catch (e) {
      throw new Error("JSON 解析失败: " + e.message);
    }

    console.log("player data:", vid_player_detail);

    if (!vid_player_detail.url) {
      throw new Error("播放地址为空");
    }

    // 先 base64 解码，再 decodeURIComponent
    const decoded = this.base64decode(vid_player_detail.url);
    const m3u8_link = decodeURIComponent(decoded);
    console.log("m3u8:", m3u8_link);
    return m3u8_link;
  }
}
