package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/namsral/flag"
	"github.com/unrolled/logger"
	"goji.io"
	"goji.io/pat"
	"log"
	"net/http"
	"os"
	"strings"
)

func main() {
	flags := flag.NewFlagSetWithEnvPrefix(os.Args[0], "CONFIG", 0)
	flags.IntVar(&CommandLineParameters.ListenPort, "port", CommandLineParameters.ListenPort, "Port to listen on.")
	flags.StringVar(&CommandLineParameters.BasePath, "base-url", CommandLineParameters.BasePath, "Base Path in URL for this service.")
	flags.StringVar(&CommandLineParameters.ListenAddress, "addr", CommandLineParameters.ListenAddress, "Address to listen on")
	flags.StringVar(&CommandLineParameters.AppFilesPath, "app-path", CommandLineParameters.AppFilesPath, "Path to HTML files for this app.")
	flags.StringVar(&CommandLineParameters.AgentImagesPath,"agent-images-path", CommandLineParameters.AgentImagesPath, "Optional: file system path to serve images for the agents from. (served from base-path/agents/).")
	flags.StringVar(&CommandLineParameters.MongoUrl,"mongo", CommandLineParameters.MongoUrl, "Mongo connect URL (slick database).")
	flags.StringVar(&CommandLineParameters.AgentImageUrlTemplate,"agent-images", CommandLineParameters.AgentImageUrlTemplate, "Template for getting images for the agents.")
	flags.StringVar(&CommandLineParameters.SlickUrl,"slick-url", CommandLineParameters.SlickUrl, "Base URL of slick")
	flags.IntVar(&CommandLineParameters.ReportPollInterval,"poll-interval", CommandLineParameters.ReportPollInterval, "How often (milliseconds) to poll the build report.")
	flags.IntVar(&CommandLineParameters.AgentImagePollInterval,"image-poll-interval", CommandLineParameters.AgentImagePollInterval, "How often (milliseconds) to fetch new images for agents.")
	flags.String(flag.DefaultConfigFlagname, "", "path to config file")

	err := flags.Parse(os.Args[1:])
	if err != nil {
		log.Fatalf("ERROR problem occurred parsing command line arguments: %s", err.Error())
	}

	log.Printf("================ Startup =======================================================")
	log.Printf("Configuration:\n%s\n", sPrettyPrint(CommandLineParameters))

	err = validateConfiguration()
	if err != nil {
		log.Fatalf("ERROR, invalid configuration: %s", err.Error())
	}

	rootMux := goji.NewMux()
	log.Printf("Configuring root prefix to be %#v", CommandLineParameters.BasePath)
	mux := goji.SubMux()
	pattern := CommandLineParameters.BasePath
	if !strings.HasPrefix(pattern, "/") {
		pattern = "/" + pattern
	}
	basePrefix := pattern
	if !strings.HasSuffix(pattern, "/") {
		pattern = pattern + "/"
	}
	pattern = pattern + "*"
	rootMux.Handle(pat.New(pattern), mux)

	// log requests
	rootMux.Use(logger.New(logger.Options{
		RemoteAddressHeaders: []string{"X-Real-IP", "X-Forwarded-For"},
		OutputFlags: log.LstdFlags,
	}).Handler)

	webAppFilesHandler := http.StripPrefix(basePrefix, http.FileServer(http.Dir(CommandLineParameters.AppFilesPath)))
	mux.Handle(pat.New("/:file.:ext"), webAppFilesHandler)
	mux.Handle(pat.New("/static/*"), webAppFilesHandler)
	mux.Handle(pat.New("/images/*"), webAppFilesHandler)
	if CommandLineParameters.AgentImagesPath != "" {
		agentImagesHandler := http.StripPrefix(fmt.Sprintf("%s/agents", basePrefix), http.FileServer(http.Dir(CommandLineParameters.AgentImagesPath)))
		mux.Handle(pat.New("/agents/*"), agentImagesHandler)
	}
	mux.HandleFunc(pat.New("/api/config"), reportConfigurationHandler)
	mux.HandleFunc(pat.New("/api/build/:buildId"), buildReportHandler)


	// serve content
	/*
	fileSystemHandler := http.StripPrefix(basePrefix, http.FileServer(http.Dir(CommandLineParameters.FileStoragePath)))
	mux.HandleFunc(pat.Get("/:group/:config.yml"), func(w http.ResponseWriter, r *http.Request) {
		group := pat.Param(r, "group")
		config := fmt.Sprintf("%s.yml", pat.Param(r, "config"))

		err = os.Mkdir(config_dir, os.ModeDir | os.ModePerm)
		if ! os.IsExist(err)  && err != nil {
			log.Printf("ERROR creating directory %s: %s", config_dir, err.Error())
		}

		fileSystemHandler.ServeHTTP(w, r)
	})


	 */
	err = http.ListenAndServe(fmt.Sprintf("%s:%d", CommandLineParameters.ListenAddress, CommandLineParameters.ListenPort), rootMux)
	if err != nil {
		log.Fatalf("ERROR problem occurred while serving content: %s", err.Error())
	}
}
// ------------ Types and variables ------------------------------------------

type Parameters struct {
	ListenPort int
	BasePath string
	ListenAddress string
	AppFilesPath string
	AgentImagesPath string
	MongoUrl string
	AgentImageUrlTemplate string
	SlickUrl string
	ReportPollInterval int
	AgentImagePollInterval int
}

type ReportConfiguration struct {
	ReportPollInterval int
	AgentImagePollInterval int
	SlickUrl string
	AgentImageUrlTemplate string
}

var (
	CommandLineParameters = Parameters{
		ListenPort: 9111,
		BasePath: "/",
		ListenAddress: "0.0.0.0",
		AppFilesPath: "app/",
		AgentImageUrlTemplate: "",
		ReportPollInterval: 1000,
		AgentImagePollInterval: 2000,
	}
)

// ------------ Business Logic --------------------------------------------

func sPrettyPrint(i interface{}) string {
	s, _ := json.MarshalIndent(i, "", "\t")
	return string(s)
}

func directoryMissing(dir string) bool {
	stat, err := os.Stat(dir)
	if err != nil {
		return true
	}

	if !stat.IsDir() {
		return true
	}

	return false
}

func validateConfiguration() error {
	configurationErrors := make([]string, 0)

	if CommandLineParameters.MongoUrl == "" {
		configurationErrors = append(configurationErrors, "mongo url cannot be empty: please supply -mongo or CONFIG_MONGO")
	}

	if CommandLineParameters.SlickUrl == "" {
		configurationErrors = append(configurationErrors, "slick url cannot be empty: please supply -slick-url or CONFIG_SLICK_URL")
	}

	if CommandLineParameters.AgentImagesPath != "" && directoryMissing(CommandLineParameters.AgentImagesPath) {
		configurationErrors = append(configurationErrors, fmt.Sprintf("unable to locate agent images path to serve %#v", CommandLineParameters.AgentImagesPath))
	}

	if directoryMissing(CommandLineParameters.AppFilesPath) {
		configurationErrors = append(configurationErrors, fmt.Sprintf("unable to locate web app files to serve from %#v", CommandLineParameters.AppFilesPath))
	}

	if len(configurationErrors) == 0 {
		return nil
	} else {
		return errors.New(strings.Join(configurationErrors, "\n"))
	}
}

func writeJsonResponse(w http.ResponseWriter, body interface{}) {
	bodyText, err := json.Marshal(body)
	if err != nil {
		log.Printf("Error generating json: %s", err.Error())
		w.Header().Add("Content-Type", "text/plain")
		w.WriteHeader(500)
		_, err = fmt.Fprint(w, "Error generating JSON")
		if err != nil {
			log.Printf("Error occurred while trying to write http response: %s", err.Error())
		}
	}
	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, err = w.Write(bodyText)
	if err != nil {
		log.Printf("Error occurred while trying to write json body: %s", err.Error())
	}
}

func reportConfigurationHandler(w http.ResponseWriter, r *http.Request) {
	writeJsonResponse(w, &ReportConfiguration{
		SlickUrl: CommandLineParameters.SlickUrl,
		AgentImageUrlTemplate: CommandLineParameters.AgentImageUrlTemplate,
		AgentImagePollInterval: CommandLineParameters.AgentImagePollInterval,
		ReportPollInterval: CommandLineParameters.ReportPollInterval,
	})
}

func buildReportHandler(w http.ResponseWriter, r *http.Request) {

}