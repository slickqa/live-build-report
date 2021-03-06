package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/namsral/flag"
	"github.com/unrolled/logger"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
	"goji.io"
	"goji.io/pat"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"strconv"
	"strings"
	"time"
)

func main() {
	flags := flag.NewFlagSetWithEnvPrefix(os.Args[0], "CONFIG", 0)
	flags.IntVar(&CommandLineParameters.ListenPort, "port", CommandLineParameters.ListenPort, "Port to listen on.")
	flags.StringVar(&CommandLineParameters.BasePath, "base-url", CommandLineParameters.BasePath, "Base Path in URL for this service.")
	flags.StringVar(&CommandLineParameters.ListenAddress, "addr", CommandLineParameters.ListenAddress, "Address to listen on")
	flags.StringVar(&CommandLineParameters.AppFilesPath, "app-path", CommandLineParameters.AppFilesPath, "Path to HTML files for this app.")
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
		log.Fatalf("ERROR invalid configuration: %s", err.Error())
	}

	client, err := connectToMongo()
	if err != nil {
		log.Fatalf("ERROR connecting to mongo: %s", err.Error())
	}
	defer func() {
		err = client.Disconnect(context.Background())
		if err != nil {
			log.Fatalf("ERROR disconnecting from mongo: %s", err.Error())
		}
	}()

	Configuration = &ReportConfiguration{
		SlickUrl: CommandLineParameters.SlickUrl,
		AgentImageUrlTemplate: CommandLineParameters.AgentImageUrlTemplate,
		AgentImagePollInterval: CommandLineParameters.AgentImagePollInterval,
		ReportPollInterval: CommandLineParameters.ReportPollInterval,
		Prefix: CommandLineParameters.BasePath,
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
	rootMux.Use(magicSinglePageApplicationHandler)

	apiMux := goji.SubMux()
	apiMux.HandleFunc(pat.New("/config"), reportConfigurationHandler)
	apiMux.HandleFunc(pat.New("/build-report/:buildId"), buildReportHandler)
	apiMux.HandleFunc(pat.New("/builds"), recentBuildSummaryHandler)
	apiMux.HandleFunc(pat.New("/builds/:project"), recentBuildSummaryHandler)
	apiMux.HandleFunc(pat.New("/projects"), currentProjectsListHandler)

	mux.Handle(pat.New("/api/*"), apiMux)
	webAppFilesHandler := http.StripPrefix(basePrefix, http.FileServer(http.Dir(CommandLineParameters.AppFilesPath)))
	mux.Handle(pat.New("/*"), webAppFilesHandler)


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

type Project struct {
	Id primitive.ObjectID `bson:"_id" json:"id"`
	Name string `bson:"name" json:"name"`
}

type Parameters struct {
	ListenPort int
	BasePath string
	ListenAddress string
	AppFilesPath string
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
	Prefix string
}

type CurrentlyRunningTest struct {
	Id primitive.ObjectID `bson:"_id"`
	Testcase map[string]interface{} `bson:"testcase"`
	Reason string `bson:"reason"`
	Attributes map[string]string `bson:"attributes"`
	Hostname string `bson:"hostname"`
	Started time.Time `bson:"started"`
	Status string `bson:"status"`
	Files []interface{} `bson:"files"`
	Links []interface{} `bson:"links"`
	Recorded time.Time `bson:"recorded"`
}

type TestrunSummary struct {
	Id interface{} `bson:"_id"`
	Name string `bson:"name"`
	TestplanId *primitive.ObjectID `bson:"testplanId"`
	PASS int `bson:"PASS"`
	FAIL int `bson:"FAIL"`
	BROKEN_TEST int `bson:"BROKEN_TEST"`
	SKIPPED int `bson:"SKIPPED"`
	NO_RESULT int `bson:"NO_RESULT"`
	SCHEDULED int `bson:"SCHEDULED"`
	TO_BE_RUN int `bson:"TO_BE_RUN"`
	RUNNING int `bson:"RUNNING"`
	FINISHED int `bson:"FINISHED"`
}

type RecentBuildsBuild struct {
	Id primitive.ObjectID `bson:"id"`
	Name string `bson:"name"`
	Built time.Time `bson:"built"`
}

type RecentBuildsRelease struct {
	Id primitive.ObjectID `bson:"id"`
	Status string `bson:"status"`
	Name string `bson:"name"`
	Build RecentBuildsBuild `bson:"builds"`
}

type RecentBuild struct {
	ProjectId primitive.ObjectID `bson:"_id"`
	ProjectName string `bson:"name"`
	Release RecentBuildsRelease `bson:"releases"`
	TestrunSummaries []TestrunSummary `bson:"testruns"`
}

type ExtendedTestrunSummary struct {
	Id interface{} `bson:"_id"`
	Name string `bson:"name"`
	TestplanId *primitive.ObjectID `bson:"testplanId"`
	PASS int `bson:"PASS"`
	FAIL int `bson:"FAIL"`
	BROKEN_TEST int `bson:"BROKEN_TEST"`
	SKIPPED int `bson:"SKIPPED"`
	NO_RESULT int `bson:"NO_RESULT"`
	SCHEDULED int `bson:"SCHEDULED"`
	TO_BE_RUN int `bson:"TO_BE_RUN"`
	RUNNING int `bson:"RUNNING"`
	FINISHED int `bson:"FINISHED"`
	Started *time.Time `bson:"started"`
	Finished *time.Time `bson:"finished"`
	ProjectName string `bson:"project"`
	ReleaseName string `bson:"release"`
	BuildName string `bson:"build"`
	CurrentlyRunning []CurrentlyRunningTest `bson:"currentlyRunning"`
}

var (
	ResultsCollection *mongo.Collection
	ProjectsCollection *mongo.Collection
	Configuration *ReportConfiguration
	CommandLineParameters = Parameters{
		ListenPort: 9111,
		BasePath: "/",
		ListenAddress: "0.0.0.0",
		AppFilesPath: "app/",
		AgentImageUrlTemplate: "",
		ReportPollInterval: 1000,
		AgentImagePollInterval: 2000,
	}
	ExtendedSummaryGroupStage = bson.M{
		"$group": bson.M{
			"_id":         "$testrun.testrunId",
			"testplanId":  bson.M{ "$first": "$testplan.testplanId" },
			"name":        bson.M{ "$first": "$testrun.name" },
			"PASS":        counterFor("$status", "PASS"),
			"FAIL":        counterFor("$status", "FAIL"),
			"BROKEN_TEST": counterFor("$status", "BROKEN_TEST"),
			"SKIPPED":     counterFor("$status", "SKIPPED"),
			"NO_RESULT":   counterFor("$status", "NO_RESULT"),
			"SCHEDULED":   counterFor("$runstatus", "SCHEDULED"),
			"TO_BE_RUN":   counterFor("$runstatus", "TO_BE_RUN"),
			"RUNNING":   counterFor("$runstatus", "RUNNING"),
			"FINISHED":   counterFor("$runstatus", "FINISHED"),
			"build": bson.M{ "$first": "$build.name"},
			"release": bson.M{ "$first": "$release.name"},
			"project": bson.M{ "$first": "$project.name"},
			"started": bson.M{ "$min": "$started"},
			"finished": bson.M{ "$max": "$finished"},
			"currentlyRunning": bson.M{
				"$addToSet": bson.M{
					"$cond": bson.M{
						"if": bson.M{ "$eq": bson.A{ "$runstatus", "RUNNING" } },
						"then": bson.M{
							"_id": "$_id",
							"testcase": "$testcase",
							"reason": "$reason",
							"attributes": "$attributes",
							"started": "$started",
							"recorded": "$recorded",
							"hostname": "$hostname",
							"status": "$status",
							"files": "$files",
							"links": "$links",
						},
						"else": nil,
					},
				},
			},
		},
	}
	CleanupExtendedSummaryGroupStage = bson.M{
		"$addFields": bson.M{
			"currentlyRunning": bson.M{
				"$filter": bson.M{
					"input": "$currentlyRunning",
					"as": "d",
					"cond": bson.M{ "$ne": bson.A{ "$$d", nil } },
				},
			},
		},
	}
	RecentBuildsProjectStage = bson.M{
		"$project": bson.M{
			"name": "$name",
			"releases": "$releases",
		},
	}
	RecentBuildsFirstUnwindStage = bson.M{
		"$unwind": bson.M{ "path": "$releases" },
	}
	RecentBuildsSecondUnwindStage = bson.M{
		"$unwind": bson.M{ "path": "$releases.builds" },
	}
	RecentBuildsSortStage = bson.M{ "$sort": bson.M{ "releases.builds.id": -1 } }
	RecentBuildsLookupStage = bson.M{
		"$lookup": bson.M{
			"from": "results",
			"as": "testruns",
			"let": bson.M{ "buildId": "$releases.builds.id" },
			"pipeline": bson.A{
				bson.M{
					"$match": bson.M{ "$expr": bson.M{ "$eq": bson.A{ "$build.buildId", "$$buildId" } } },
				},
				bson.M{
					"$group": bson.M{
						"_id": "$testrun.testrunId",
						"testplanId":  bson.M{ "$first": "$testplan.testplanId" },
						"name":        bson.M{ "$first": "$testrun.name" },
						"PASS":        counterFor("$status", "PASS"),
						"FAIL":        counterFor("$status", "FAIL"),
						"BROKEN_TEST": counterFor("$status", "BROKEN_TEST"),
						"SKIPPED":     counterFor("$status", "SKIPPED"),
						"NO_RESULT":   counterFor("$status", "NO_RESULT"),
						"SCHEDULED":   counterFor("$runstatus", "SCHEDULED"),
						"TO_BE_RUN":   counterFor("$runstatus", "TO_BE_RUN"),
						"RUNNING":   counterFor("$runstatus", "RUNNING"),
						"FINISHED":   counterFor("$runstatus", "FINISHED"),

					},
				},
			},
		},
	}
)

// ------------ Business Logic --------------------------------------------

func counterFor(name string, value string) bson.M {
	return bson.M{
		"$sum": bson.M{
			"$cond": bson.M{
				"if": bson.M{
					"$eq": bson.A{ name, value },
				},
				"then": 1,
				"else": 0,
			},
		},
	}
}

func matchStageForBuildId(buildId string) (bson.M, error) {
	id, err := primitive.ObjectIDFromHex(buildId)
	if err != nil {
		return bson.M{}, err
	}

	return bson.M{
		"$match": bson.M{
			"build.buildId": id,
		},
	}, nil
}

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

	if directoryMissing(CommandLineParameters.AppFilesPath) {
		configurationErrors = append(configurationErrors, fmt.Sprintf("unable to locate web app files to serve from %#v", CommandLineParameters.AppFilesPath))
	}

	if len(configurationErrors) == 0 {
		return nil
	} else {
		return errors.New(strings.Join(configurationErrors, "\n"))
	}
}

func connectToMongo() (*mongo.Client, error) {
	log.Println("Connecting to mongo.")

	client, err := mongo.NewClient(options.Client().ApplyURI(CommandLineParameters.MongoUrl))
	if err != nil {
		return nil, err
	}

	ctx, _ := context.WithTimeout(context.Background(), 10*time.Second)
	err = client.Connect(ctx)

	if err != nil {
		return nil, err
	}

	// Check the connection
	ctx, _ = context.WithTimeout(context.Background(), 2*time.Second)
	err = client.Ping(ctx, readpref.Primary())

	if err != nil {
		return nil, err
	}

	connectUrl, err := url.Parse(CommandLineParameters.MongoUrl)
	if err != nil {
		return nil, fmt.Errorf("parsing mongo url %s", err.Error())
	}
	dbname := strings.TrimLeft(connectUrl.Path, "/")
	ResultsCollection = client.Database(dbname).Collection("results")
	ProjectsCollection = client.Database(dbname).Collection("projects")
	if ResultsCollection == nil {
		return nil, errors.New("no results collection returned from mongo")
	}

	log.Println("Connected to MongoDB!")
	return client, nil
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
	w.Header().Add("Content-Type", "application/json;charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, err = w.Write(bodyText)
	if err != nil {
		log.Printf("Error occurred while trying to write json body: %s", err.Error())
	}
}

func magicSinglePageApplicationHandler(inner http.Handler) http.Handler {
	ApiPrefix := fmt.Sprintf("%s/api", CommandLineParameters.BasePath)
	if strings.HasSuffix(CommandLineParameters.BasePath, "/") {
		ApiPrefix = fmt.Sprintf("%sapi", CommandLineParameters.BasePath)
	}
	indexContent, err := ioutil.ReadFile(path.Join(CommandLineParameters.AppFilesPath, "index.html"))
	if err != nil {
		log.Fatalf("ERROR: unable to read in index.html from %s: %s\n", CommandLineParameters.AppFilesPath, err.Error())
	}
	indexString := string(indexContent)
	indexString = strings.ReplaceAll(indexString, "ROOT/", CommandLineParameters.BasePath)
	mw := func(w http.ResponseWriter, r *http.Request) {
		dotPos := strings.LastIndex(r.URL.Path, ".")
		if strings.HasPrefix(r.URL.Path, ApiPrefix) || (dotPos > 0 && (len(r.URL.Path) - dotPos) <= 5) {
			inner.ServeHTTP(w, r)
		} else {
			w.Header().Set("Content-Type", "text/html;charset=utf-8")
			w.WriteHeader(http.StatusOK)
			_, err = fmt.Fprint(w, indexString)
			if err != nil {
				log.Printf("Error occured while outputing index.html: %s", err.Error())
			}
		}
	}
	return http.HandlerFunc(mw)
}

func reportConfigurationHandler(w http.ResponseWriter, r *http.Request) {
	writeJsonResponse(w, Configuration)
}

func buildReportHandler(w http.ResponseWriter, r *http.Request) {
	buildId := pat.Param(r, "buildId")
	MatchStage, err := matchStageForBuildId(buildId)
	if err != nil {
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusBadRequest)
		_, _ = fmt.Fprintf(w, "Invalid build id %#v", buildId)
		return
	}
	cursor, err := ResultsCollection.Aggregate(context.Background(), bson.A{ MatchStage, ExtendedSummaryGroupStage, CleanupExtendedSummaryGroupStage})
	if err != nil {
		log.Printf("Error aggregating data from database: %s", err.Error())
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = fmt.Fprintln(w, "Error occurred while trying to get data from database.")
		return
	}
	ctx := context.Background()
	var report []ExtendedTestrunSummary
	for cursor.Next(ctx) {
		var item ExtendedTestrunSummary
		err = cursor.Decode(&item)

		if err != nil {
			log.Printf("Error decoding result of aggregation: %s", err.Error())
			w.Header().Set("Content-Type", "text/plain")
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = fmt.Fprintln(w, "Error occurred while trying to get data from database.")
			return
		}
		report = append(report, item)
	}
	writeJsonResponse(w, &report)
}

func recentBuildSummaryHandler(w http.ResponseWriter, r *http.Request) {
	projectName := "all"
	if strings.Contains(r.URL.Path, "builds/") {
		projectName = pat.Param(r, "project")
	}
	count := 25
	var err error
	if len(r.URL.Query().Get("limit")) > 0 {
		count, err = strconv.Atoi(r.URL.Query().Get("limit"))
		if err != nil {
			count = 25
		}
	}

	pipeline := bson.A{}
	if projectName != "all" {
		pipeline = bson.A{ bson.M{"$match": bson.M{ "name": projectName } } }
	}
	pipeline = append(pipeline, RecentBuildsProjectStage, RecentBuildsFirstUnwindStage,
		RecentBuildsSecondUnwindStage, RecentBuildsSortStage, bson.M{ "$limit": count }, RecentBuildsLookupStage )

	cursor, err := ProjectsCollection.Aggregate(context.Background(), pipeline)
	if err != nil {
		log.Printf("Error aggregating data from database getting recent builds: %s", err.Error())
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = fmt.Fprintln(w, "Error occurred while trying to get recent builds from database.")
		return
	}

	ctx := context.Background()
	var builds []RecentBuild
	for cursor.Next(ctx) {
		var item RecentBuild
		err = cursor.Decode(&item)

		if err != nil {
			log.Printf("Error decoding result of aggregation for recent builds: %s", err.Error())
			w.Header().Set("Content-Type", "text/plain")
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = fmt.Fprintln(w, "Error occurred while trying to get recent builds from database.")
			return
		}

		builds = append(builds, item)
	}
	writeJsonResponse(w, &builds)
}

func currentProjectsListHandler(w http.ResponseWriter, r *http.Request) {
	cursor, err := ProjectsCollection.Find(context.Background(), bson.M{}, &options.FindOptions{Projection: bson.M{"name": 1}})
	if err != nil {
		log.Printf("Error listing Projects: %s", err.Error())
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = fmt.Fprintln(w, "Error occurred while trying to query database for projects")
		return
	}
	var projects []Project
	for cursor.Next(context.Background()) {
		var item Project
		err = cursor.Decode(&item)
		if err != nil {
			log.Printf("Error decoding projects from mongo: %s", err.Error())
			w.Header().Set("Content-Type", "text/plain")
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = fmt.Fprintln(w, "Error occurred while trying to decode project list from database.")
			return
		}
		projects = append(projects, item)
	}
	writeJsonResponse(w, projects)
}