//! Kineo FFmpeg CLI Command Builder with VideoToolbox & NVENC Hardware Acceleration

pub struct FFmpegCommandBuilder {
    input: Option<String>,
    audio_input: Option<String>,
    output: Option<String>,
    codec: Option<String>,
    resolution: Option<String>,
    fps: Option<u32>,
    filters: Vec<String>,
    bitrate: Option<String>,
}

impl FFmpegCommandBuilder {
    pub fn new() -> Self {
        Self {
            input: None,
            audio_input: None,
            output: None,
            codec: None,
            resolution: None,
            fps: None,
            filters: Vec::new(),
            bitrate: None,
        }
    }

    pub fn input(mut self, path: &str) -> Self {
        self.input = Some(path.to_string());
        self
    }

    pub fn audio_input(mut self, path: &str) -> Self {
        self.audio_input = Some(path.to_string());
        self
    }

    pub fn output(mut self, path: &str) -> Self {
        self.output = Some(path.to_string());
        self
    }

    pub fn codec(mut self, codec_name: &str) -> Self {
        self.codec = Some(codec_name.to_string());
        self
    }

    pub fn resolution(mut self, res: &str) -> Self {
        self.resolution = Some(res.to_string());
        self
    }

    pub fn fps(mut self, fps: u32) -> Self {
        self.fps = Some(fps);
        self
    }

    pub fn bitrate(mut self, bitrate: &str) -> Self {
        self.bitrate = Some(bitrate.to_string());
        self
    }

    pub fn filter(mut self, filter: &str) -> Self {
        self.filters.push(filter.to_string());
        self
    }

    pub fn with_pan_zoom(mut self, camera_type: &str) -> Self {
        let zoom_filter = match camera_type {
            "pan" => "zoompan=z='1.2':x='if(gte(x,100),0,x+1)':d=125:s=1920x1080",
            "tilt" => "zoompan=z='1.2':y='if(gte(y,100),0,y+1)':d=125:s=1920x1080",
            "dolly" | "closeup" => "zoompan=z='min(zoom+0.0015,1.5)':d=125:s=1920x1080",
            _ => "zoompan=z='1.0':d=125:s=1920x1080",
        };
        self.filters.push(zoom_filter.to_string());
        self
    }

    pub fn build(self) -> Vec<String> {
        let mut args = Vec::new();
        args.push("-y".to_string()); // 覆盖已有文件

        if let Some(input) = self.input {
            args.push("-i".to_string());
            args.push(input);
        }

        if let Some(audio_input) = self.audio_input {
            args.push("-i".to_string());
            args.push(audio_input);
        }

        if let Some(fps) = self.fps {
            args.push("-r".to_string());
            args.push(fps.to_string());
        }

        if let Some(res) = self.resolution {
            args.push("-s".to_string());
            args.push(res);
        }

        if !self.filters.is_empty() {
            args.push("-vf".to_string());
            args.push(self.filters.join(","));
        }

        if let Some(codec) = self.codec {
            args.push("-c:v".to_string());
            args.push(codec);
        } else {
            // 自动推理硬件编码器
            #[cfg(target_os = "macos")]
            {
                args.push("-c:v".to_string());
                args.push("h264_videotoolbox".to_string());
            }
            #[cfg(not(target_os = "macos"))]
            {
                args.push("-c:v".to_string());
                args.push("libx264".to_string());
            }
        }

        if let Some(b) = self.bitrate {
            args.push("-b:v".to_string());
            args.push(b);
        }

        if let Some(output) = self.output {
            args.push(output);
        }

        args
    }
}

pub fn build_concat_command(inputs: &[&str], output: &str) -> Vec<String> {
    let mut args = Vec::new();
    args.push("-y".to_string());

    for input in inputs {
        args.push("-i".to_string());
        args.push(input.to_string());
    }

    let filter = format!("concat=n={}:v=1:a=1", inputs.len());
    args.push("-filter_complex".to_string());
    args.push(filter);

    args.push(output.to_string());
    args
}

pub fn build_thumbnail_command(input: &str, output: &str, timestamp: f32) -> Vec<String> {
    vec![
        "-y".to_string(),
        "-ss".to_string(),
        timestamp.to_string(),
        "-i".to_string(),
        input.to_string(),
        "-vframes".to_string(),
        "1".to_string(),
        "-q:v".to_string(),
        "2".to_string(),
        output.to_string(),
    ]
}
